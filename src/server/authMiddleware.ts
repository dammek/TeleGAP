import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface AuthenticatedTelegramRequest extends Request {
  telegramUser?: TelegramWebAppUser;
  isTelegramVerified?: boolean;
}

/**
 * Validates Telegram Mini App `initData` using HMAC-SHA256.
 * Specifically configured for the bot `@Tel_alum_bot`.
 * 
 * Cryptographic protocol:
 * 1. Parse query params from `initData`
 * 2. Extract `hash` parameter
 * 3. Sort remaining key=value pairs alphabetically and join with newline
 * 4. secret_key = HMAC_SHA256("WebAppData", BOT_TOKEN)
 * 5. calculated_hash = HMAC_SHA256(secret_key, data_check_string).hex()
 * 6. timingSafeEqual(calculated_hash, hash)
 * 7. Validate freshness (within 24 hours to prevent replay attacks)
 */
export function verifyTelegramWebAppData(
  req: AuthenticatedTelegramRequest,
  res: Response,
  next: NextFunction
) {
  const initData = (req.headers['x-telegram-init-data'] as string) || (req.query.initData as string);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // If no bot token is set in preview or development mode, allow controlled fallback
  if (!botToken) {
    // In development/preview sandbox, extract mock or header user without blocking execution
    const fallbackId = (req.headers['x-telegram-user-id'] as string) || (req.query.tgUserId as string) || '984102941';
    req.telegramUser = {
      id: Number(fallbackId) || 984102941,
      first_name: (req.query.firstName as string) || 'Telegram Alumnus',
      username: (req.query.username as string) || 'Tel_alum_bot_user'
    };
    req.isTelegramVerified = false;
    return next();
  }

  if (!initData) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed: Missing x-telegram-init-data header'
    });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: Missing hash in Telegram initData'
      });
    }

    urlParams.delete('hash');

    // 1. Sort remaining keys alphabetically
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    // 2. Compute secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    // 3. Compute hash
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // 4. Timing safe comparison
    const hashBuffer = Buffer.from(hash, 'hex');
    const calcBuffer = Buffer.from(calculatedHash, 'hex');

    if (hashBuffer.length !== calcBuffer.length || !crypto.timingSafeEqual(hashBuffer, calcBuffer)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid Telegram WebApp HMAC signature'
      });
    }

    // 5. Check auth_date for replay attack prevention (1 day freshness window)
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Telegram authentication session expired'
      });
    }

    // 6. Extract user object
    const userJson = urlParams.get('user');
    if (userJson) {
      req.telegramUser = JSON.parse(userJson);
      req.isTelegramVerified = true;
    }

    next();
  } catch (err: any) {
    console.error('Error during Telegram HMAC verification:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error verifying Telegram authentication'
    });
  }
}
