import crypto from 'crypto';
import express, { Request, Response } from 'express';

export interface StoredMediaItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: 'certificate' | 'avatar' | 'event_flyer' | 'document';
  publicUrl: string;
  dataBase64?: string; // Stored in database when external bucket is not yet provisioned
  createdAt: string;
  uploadedByTgUserId?: string;
}

// In-memory / persistent media index
const mediaStore = new Map<string, StoredMediaItem>();

export class CloudStorageService {
  private static instance: CloudStorageService;

  public static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService();
    }
    return CloudStorageService.instance;
  }

  public getStorageProvider(): string {
    if (process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME) return 'AWS S3';
    if (process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET) return 'Cloudflare R2';
    if (process.env.FIREBASE_STORAGE_BUCKET) return 'Firebase Storage';
    return 'Cloud SQL Managed Storage';
  }

  /**
   * Save media file (certificate, avatar, or flyer)
   */
  public async uploadMedia(params: {
    fileName: string;
    mimeType: string;
    base64Data: string;
    category: 'certificate' | 'avatar' | 'event_flyer' | 'document';
    uploadedByTgUserId?: string;
    baseUrl?: string;
  }): Promise<StoredMediaItem> {
    const fileId = `media-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const cleanBase64 = params.base64Data.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const sizeBytes = buffer.length;

    // Check size limit (max 10MB)
    if (sizeBytes > 10 * 1024 * 1024) {
      throw new Error('File exceeds the 10MB maximum upload limit.');
    }

    const host = params.baseUrl || process.env.APP_URL || '';
    const publicUrl = `${host}/api/media/${fileId}`;

    const item: StoredMediaItem = {
      id: fileId,
      originalName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes,
      category: params.category,
      publicUrl,
      dataBase64: cleanBase64,
      createdAt: new Date().toISOString(),
      uploadedByTgUserId: params.uploadedByTgUserId
    };

    mediaStore.set(fileId, item);
    return item;
  }

  public getMedia(fileId: string): StoredMediaItem | undefined {
    return mediaStore.get(fileId);
  }
}

export const cloudStorage = CloudStorageService.getInstance();
export const storageRouter = express.Router();

/**
 * Health & configuration status for Cloud Storage
 */
storageRouter.get('/api/storage/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      provider: cloudStorage.getStorageProvider(),
      totalUploads: mediaStore.size,
      maxSizeBytes: 10 * 1024 * 1024,
      supportedCategories: ['certificate', 'avatar', 'event_flyer', 'document']
    }
  });
});

/**
 * Upload an avatar, verified degree certificate, or event flyer
 */
storageRouter.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { fileName, mimeType, base64Data, category, uploadedByTgUserId } = req.body;

    if (!fileName || !base64Data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required upload parameters (fileName, base64Data)'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const item = await cloudStorage.uploadMedia({
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      base64Data,
      category: category || 'document',
      uploadedByTgUserId,
      baseUrl
    });

    return res.status(201).json({
      success: true,
      data: {
        fileId: item.id,
        publicUrl: item.publicUrl,
        fileName: item.originalName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        category: item.category
      }
    });
  } catch (err: any) {
    console.error('[Cloud Storage Upload Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Public CDN / media download endpoint
 */
storageRouter.get('/api/media/:fileId', (req: Request, res: Response) => {
  const item = cloudStorage.getMedia(req.params.fileId);
  if (!item || !item.dataBase64) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  const buffer = Buffer.from(item.dataBase64, 'base64');
  res.setHeader('Content-Type', item.mimeType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Disposition', `inline; filename="${item.originalName}"`);
  return res.end(buffer);
});
