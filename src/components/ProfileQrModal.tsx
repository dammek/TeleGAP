import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlumniProfile, Institution } from '../types';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { TelegramSdkWrapper } from '../lib/telegramSdk';

interface ProfileQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AlumniProfile;
  institution?: Institution | null;
}

export const ProfileQrModal: React.FC<ProfileQrModalProps> = ({
  isOpen,
  onClose,
  profile,
  institution
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !profile) return null;

  const user = profile.user;
  const displayName = user
    ? `${user.tgFirstName} ${user.tgLastName || ''}`.trim()
    : 'Alumnus';

  // Construct absolute profile deep link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alumni.t.me';
  const profileUrl = `${origin}/?profileId=${profile.id}&inst=${profile.institutionId}`;

  const handleCopyLink = () => {
    TelegramSdkWrapper.haptic('light');
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQrPng = () => {
    TelegramSdkWrapper.haptic('medium');
    setDownloading(true);

    try {
      const svgElement = qrWrapperRef.current?.querySelector('svg');
      if (!svgElement) return;

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const padding = 32;
        canvas.width = image.width + padding * 2;
        canvas.height = image.height + padding * 2;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill crisp dark background
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw QR in center
          ctx.drawImage(image, padding, padding);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${displayName.replace(/\s+/g, '_')}_Alumni_QR.png`;
          downloadLink.href = pngUrl;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        setDownloading(false);
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (e) {
      console.error('Error exporting QR PNG:', e);
      setDownloading(false);
    }
  };

  const handleShareToTelegram = () => {
    TelegramSdkWrapper.haptic('light');
    const shareText = encodeURIComponent(`Connect with ${displayName} (${profile.jobTitle || 'Alumnus'} at ${profile.company || institution?.shortName || 'University'}) on the Official Alumni Network! 🎓`);
    const shareUrl = encodeURIComponent(profileUrl);
    window.open(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Alumni Digital Badge QR</h3>
          </div>
          <button
            onClick={() => {
              TelegramSdkWrapper.haptic('light');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-4">
          {/* Identity Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h4 className="font-bold text-base text-slate-100">{displayName}</h4>
              {profile.verificationStatus === 'VERIFIED' && (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              {profile.jobTitle || 'Alumnus'} {profile.company ? `@ ${profile.company}` : ''}
            </p>
            <p className="text-[11px] text-blue-400 font-mono">
              {institution?.shortName || 'Alumni'} • Class of {profile.graduationYear}
            </p>
          </div>

          {/* QR Code Container */}
          <div
            ref={qrWrapperRef}
            className="p-4 bg-white rounded-2xl inline-block shadow-xl shadow-black/40 border-4 border-slate-800"
          >
            <QRCodeSVG
              value={profileUrl}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: user?.tgPhotoUrl || institution?.logoUrl || '',
                height: 38,
                width: 38,
                excavate: true
              }}
            />
          </div>

          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Scan with any camera or Telegram scanner to open profile instantly.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleCopyLink}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                copied
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Profile Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Profile Link</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQrPng}
                disabled={downloading}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3 h-3 text-blue-400" />
                <span>Save PNG</span>
              </button>

              <button
                onClick={handleShareToTelegram}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
