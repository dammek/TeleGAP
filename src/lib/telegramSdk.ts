import { TelegramUser } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          header_bg_color?: string;
          accent_text_color?: string;
          section_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
      };
    };
  }
}

export class TelegramSdkWrapper {
  private static isInitialized = false;
  private static hapticsEnabled: boolean = (() => {
    try {
      const saved = localStorage.getItem('tma_haptics_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  })();

  public static isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  public static setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    try {
      localStorage.setItem('tma_haptics_enabled', String(enabled));
    } catch {
      // ignore
    }
  }

  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  }

  public static getWebApp() {
    if (this.isAvailable()) {
      return window.Telegram!.WebApp;
    }
    return null;
  }

  public static init() {
    if (this.isInitialized) return;
    const tg = this.getWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
      console.log('[TMA SDK Initialized]: Platform =', tg.platform, 'Version =', tg.version);
    }
    this.isInitialized = true;
  }

  public static isRealTelegramEnvironment(): boolean {
    const tg = this.getWebApp();
    return Boolean(tg && (tg.initDataUnsafe?.user?.id || (tg.initData && tg.initData.length > 0)));
  }

  public static getTelegramUser(fallbackUser?: Partial<TelegramUser>): TelegramUser {
    const tg = this.getWebApp();
    const unsafeUser = tg?.initDataUnsafe?.user;

    if (unsafeUser && unsafeUser.id) {
      return {
        id: `user-${unsafeUser.id}`,
        tgUserId: String(unsafeUser.id),
        tgUsername: unsafeUser.username,
        tgFirstName: unsafeUser.first_name,
        tgLastName: unsafeUser.last_name,
        tgPhotoUrl: unsafeUser.photo_url,
        tgLanguageCode: unsafeUser.language_code || 'en',
        isPremium: unsafeUser.is_premium
      };
    }

    // Default demo user fallback (Adebayo - FUT Minna / UNILAG Alum)
    return {
      id: fallbackUser?.id || 'user-001',
      tgUserId: fallbackUser?.tgUserId || '984102941',
      tgUsername: fallbackUser?.tgUsername ?? 'adebayo_dev',
      tgFirstName: fallbackUser?.tgFirstName || 'Adebayo',
      tgLastName: fallbackUser?.tgLastName || 'Ogunlesi',
      tgPhotoUrl: fallbackUser?.tgPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tgLanguageCode: 'en',
      isPremium: true
    };
  }

  public static haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') {
    if (!this.hapticsEnabled) return;
    const tg = this.getWebApp();
    if (!tg?.HapticFeedback) return;

    try {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch {
      // Haptics safe fallback
    }
  }

  public static openLink(url: string) {
    const tg = this.getWebApp();
    if (tg?.openTelegramLink && (url.startsWith('https://t.me/') || url.startsWith('tg://'))) {
      tg.openTelegramLink(url);
    } else if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
