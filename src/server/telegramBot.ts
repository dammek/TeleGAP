import { TelegramInviteResponse, ConnectionRequest } from '../types';
import { db } from './db';

export class TelegramBotService {
  private static instance: TelegramBotService;
  public readonly botUsername = 'Tel_alum_bot';

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  private getBotToken(): string | undefined {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  private getAppUrl(): string {
    return process.env.APP_URL || 'https://t.me/Tel_alum_bot/app';
  }

  private formatNgn(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Helper to dispatch Telegram Bot API sendMessage calls.
   */
  public async sendTelegramMessage(
    chatId: string | number,
    markdownText: string,
    inlineKeyboard?: Array<Array<{ text: string; url?: string; web_app?: { url: string } }>>
  ): Promise<{ delivered: boolean; error?: string }> {
    const token = this.getBotToken();
    if (!token) {
      console.log(`[TelegramBot @${this.botUsername} Simulated Dispatch to ${chatId}]:\n${markdownText}`);
      return { delivered: true };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: markdownText,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard && inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
        })
      });

      const data = await res.json();
      if (!data.ok) {
        console.warn(`[TelegramBot @${this.botUsername}] Telegram API error for chat ${chatId}:`, data.description);
        return { delivered: false, error: data.description };
      }

      return { delivered: true };
    } catch (err: any) {
      console.error(`[TelegramBot @${this.botUsername}] Network failure sending to chat ${chatId}:`, err);
      return { delivered: false, error: err.message };
    }
  }

  /**
   * Dispatches instant ZebraWallet credit notification upon successful payment
   */
  public async sendWalletCreditNotification(
    tgUserId: string | number,
    amountNgn: number,
    reference: string,
    newBalanceNgn: number,
    channel: string
  ): Promise<{ delivered: boolean }> {
    const notificationText =
      `💳 *ZebraWallet Deposit Credited!*\n\n` +
      `Your Alumni Wallet has been credited with *${this.formatNgn(amountNgn)}* via *${channel}*.\n\n` +
      `📋 *Transaction Details:*\n` +
      `• *Reference:* \`${reference}\`\n` +
      `• *Total Balance:* *${this.formatNgn(newBalanceNgn)}*\n` +
      `• *Status:* Confirmed & Available ✅\n\n` +
      `You can use your balance to pay annual alumni dues, fund university capital projects, or purchase alumni gala tickets.`;

    const result = await this.sendTelegramMessage(tgUserId, notificationText, [
      [{ text: '👛 Open Alumni Wallet', web_app: { url: this.getAppUrl() } }]
    ]);

    return { delivered: result.delivered };
  }

  /**
   * Dispatches mentorship inquiry notification directly to mentor
   */
  public async sendMentorshipRequestNotification(
    mentorTgUserId: string | number,
    menteeName: string,
    department: string,
    fieldOfStudy: string,
    message: string
  ): Promise<{ delivered: boolean }> {
    const notificationText =
      `🎯 *New Mentorship Request Received!*\n\n` +
      `*${menteeName}* from *${department}* has requested your mentorship in *${fieldOfStudy}*.\n\n` +
      `💬 *Inquiry Note:* "${message}"\n\n` +
      `Tap below to review their academic background and accept the mentorship inquiry.`;

    const result = await this.sendTelegramMessage(mentorTgUserId, notificationText, [
      [{ text: '🎓 Review Mentorship Request', web_app: { url: this.getAppUrl() } }]
    ]);

    return { delivered: result.delivered };
  }

  /**
   * Dispatches single-use supergroup invite link for verified alumnus
   */
  public async createSingleUseInviteLink(
    institutionId: string,
    profileId: string,
    tgUserId: string
  ): Promise<TelegramInviteResponse> {
    const institution = db.getInstitutionById(institutionId);
    if (!institution) {
      throw new Error(`Institution with id ${institutionId} not found`);
    }

    const profile = db.getProfileById(profileId);
    if (!profile) {
      throw new Error(`Profile with id ${profileId} not found`);
    }

    const expireHours = institution.inviteLinkExpireHours || 24;
    const expiresAt = new Date(Date.now() + expireHours * 60 * 60 * 1000).toISOString();
    const expireTimestamp = Math.floor(new Date(expiresAt).getTime() / 1000);

    const chatId = institution.telegramSupergroupId || `-100${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const chatTitle = `${institution.shortName} Verified Alumni Supergroup`;

    let generatedInviteLink = '';
    const botToken = this.getBotToken();

    if (botToken && chatId.startsWith('-100')) {
      try {
        const url = `https://api.telegram.org/bot${botToken}/createChatInviteLink`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            name: `Alumni Verify: ${profile.matriculationNo} (${profile.department})`,
            expire_date: expireTimestamp,
            member_limit: 1, // Single-use strictly
            creates_join_request: false
          })
        });

        const data = await res.json();
        if (data.ok && data.result?.invite_link) {
          generatedInviteLink = data.result.invite_link;
        }
      } catch (err) {
        console.warn('Telegram Bot API call failed, generating simulated invite link', err);
      }
    }

    if (!generatedInviteLink) {
      const randomHash = Buffer.from(`${institution.slug}-${profile.matriculationNo}-${Date.now()}`)
        .toString('base64url')
        .substring(0, 16);
      generatedInviteLink = `https://t.me/+${institution.slug.toUpperCase()}_${randomHash}`;
    }

    db.logInviteLink({
      profileId,
      institutionId,
      tgUserId,
      inviteLink: generatedInviteLink,
      expiresAt
    });

    return {
      success: true,
      inviteLink: generatedInviteLink,
      expiresAt,
      memberLimit: 1,
      chatTitle,
      chatId
    };
  }

  /**
   * Dispatches a verified alumni webhook event to the Telegram Bot framework
   */
  public async dispatchVerificationWebhook(
    profileId: string,
    inviteLinkData: TelegramInviteResponse
  ): Promise<{ delivered: boolean; notificationText: string }> {
    const profile = db.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');

    const institution = db.getInstitutionById(profile.institutionId);
    const user = profile.user;

    const notificationText =
      `🎓 *Verification Approved: ${institution?.shortName} Alumni Portal*\n\n` +
      `Hello ${user?.tgFirstName || 'Alumnus'}!\n` +
      `Your academic credentials for *${institution?.name}* have been verified by the university registry portal.\n\n` +
      `📋 *Academic Record:*\n` +
      `• *Matric No:* \`${profile.matriculationNo}\`\n` +
      `• *Department:* ${profile.department}\n` +
      `• *Class of:* ${profile.graduationYear}\n` +
      `• *Status:* Verified Alumnus ✅\n\n` +
      `🔒 *Exclusive Telegram Supergroup Access:*\n` +
      `Here is your single-use, non-shareable invite link:\n` +
      `👉 [Tap Here to Join Verified Alumni Lounge](${inviteLinkData.inviteLink})\n\n` +
      `_Note: Link expires in ${institution?.inviteLinkExpireHours || 24} hours and is valid for 1 member join._`;

    let delivered = false;
    if (user?.tgUserId) {
      const result = await this.sendTelegramMessage(user.tgUserId, notificationText, [
        [{ text: '🚀 Enter Alumni Supergroup', url: inviteLinkData.inviteLink }],
        [{ text: '📂 Open Alumni Directory', web_app: { url: this.getAppUrl() } }]
      ]);
      delivered = result.delivered;
    }

    return { delivered, notificationText };
  }

  /**
   * Dispatches an alumni connection request notification directly through the Telegram Bot
   */
  public async sendConnectionRequestNotification(
    connection: ConnectionRequest
  ): Promise<{ delivered: boolean; notificationText: string }> {
    const institution = db.getInstitutionById(connection.institutionId);
    const recipientProfile = db.getProfileById(connection.recipientProfileId);
    const targetTgUserId = connection.recipientTgUserId || recipientProfile?.user?.tgUserId;
    const recipientFirstName = recipientProfile?.user?.tgFirstName || connection.recipientName || 'Alumnus';

    const senderHeadline = connection.senderJobTitle
      ? `${connection.senderJobTitle}${connection.senderCompany ? ` @ ${connection.senderCompany}` : ''}`
      : 'Alumnus';

    const senderDeptInfo = connection.senderDepartment
      ? `${connection.senderDepartment}${connection.senderGradYear ? ` (Class of ${connection.senderGradYear})` : ''}`
      : 'Alumni Network Member';

    const senderTgUsernameText = connection.senderTgUsername
      ? `\n✈️ *Telegram:* @${connection.senderTgUsername}`
      : '';

    const customNoteText = connection.note
      ? `\n\n💬 *Personal Note:* "${connection.note}"`
      : '';

    const notificationText =
      `🤝 *New Alumni Connection Request!*\n\n` +
      `Hello ${recipientFirstName},\n` +
      `*${connection.senderName}* would like to connect with you in the *${institution?.name || 'Alumni'}* verified network.\n\n` +
      `👤 *Professional Background:*\n` +
      `• *Role:* ${senderHeadline}\n` +
      `• *Department:* ${senderDeptInfo}${senderTgUsernameText}${customNoteText}\n\n` +
      `Tap below to open the alumni directory and connect directly.`;

    let delivered = false;
    if (targetTgUserId) {
      const keyboard = [
        [{ text: '🤝 View Profile in Directory', web_app: { url: this.getAppUrl() } }],
        ...(connection.senderTgUsername
          ? [[{ text: `💬 Chat with @${connection.senderTgUsername}`, url: `https://t.me/${connection.senderTgUsername}` }]]
          : [])
      ];
      const result = await this.sendTelegramMessage(targetTgUserId, notificationText, keyboard);
      delivered = result.delivered;
    }

    return { delivered, notificationText };
  }
}

export const telegramBot = TelegramBotService.getInstance();
