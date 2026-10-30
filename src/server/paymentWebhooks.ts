import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { db } from './db';
import { telegramBot } from './telegramBot';

export const webhookRouter = express.Router();

/**
 * Health check & webhook verification status
 */
webhookRouter.get('/api/webhooks/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      paystackConfigured: !!process.env.PAYSTACK_SECRET_KEY,
      flutterwaveConfigured: false,
      flutterwaveEnabled: false,
      telegramBotConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
      botUsername: telegramBot.botUsername,
      paystackWebhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/paystack`,
      flutterwaveWebhookUrl: null
    }
  });
});

/**
 * Paystack Webhook Handler (Nigeria NGN & Cards)
 * Verifies HMAC-SHA512 signature in `x-paystack-signature`
 */
webhookRouter.post('/api/webhooks/paystack', async (req: Request, res: Response) => {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'] as string;

    // In production, signature verification is strictly enforced
    if (paystackSecret && signature) {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const hash = crypto.createHmac('sha512', paystackSecret).update(rawBody).digest('hex');

      if (hash !== signature) {
        console.warn('[Paystack Webhook] Signature mismatch');
        return res.status(401).json({ success: false, error: 'Invalid Paystack signature' });
      }
    } else if (process.env.NODE_ENV === 'production' && !paystackSecret) {
      console.warn('[Paystack Webhook] Missing PAYSTACK_SECRET_KEY environment variable');
    }

    const payload = req.body;
    const event = payload?.event;

    if (event === 'charge.success') {
      const data = payload.data;
      const reference = data?.reference;
      const amountNgn = (data?.amount || 0) / 100; // Paystack sends amounts in Kobo
      const metadata = data?.metadata || {};
      const tgUserId = metadata.tgUserId || metadata.userId || '984102941';
      const channel = data?.channel || 'card';

      // Check if reference already processed (Idempotency)
      const existingTx = db.getTransactionByReference(reference);
      if (existingTx) {
        return res.status(200).json({ success: true, message: 'Transaction already processed' });
      }

      // Credit the ZebraWallet
      const wallet = db.creditWallet(tgUserId, amountNgn, {
        reference,
        channel: `PAYSTACK_${channel.toUpperCase()}`,
        title: `Paystack Deposit (${channel})`,
        description: `Instant online deposit of ₦${amountNgn.toLocaleString()} via Paystack payment gateway.`
      });

      // Dispatch real-time Telegram notification via @Tel_alum_bot
      await telegramBot.sendWalletCreditNotification(
        tgUserId,
        amountNgn,
        reference,
        wallet.balanceNgn,
        'Paystack Payment Gateway'
      );

      return res.status(200).json({
        success: true,
        message: 'Wallet credited and Telegram alert dispatched'
      });
    }

    return res.status(200).json({ success: true, message: 'Event ignored' });
  } catch (err: any) {
    console.error('[Paystack Webhook Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Flutterwave Webhook Handler (Temporarily Disabled)
 */
webhookRouter.post('/api/webhooks/flutterwave', async (_req: Request, res: Response) => {
  return res.status(503).json({
    success: false,
    error: 'Flutterwave payment processing is currently disabled.'
  });
});
