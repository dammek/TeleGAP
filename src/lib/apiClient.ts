import { INITIAL_INSTITUTIONS, INITIAL_ALUMNI_PROFILES, DEMO_TELEGRAM_USERS } from '../server/mockData';
import { Institution, AlumniProfile } from '../types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Safe JSON fetch utility that guards against HTML 404/500/Index fallback responses
 * (which cause `Unexpected token '<', "<!doctype "... is not valid JSON`)
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const headers = new Headers(init?.headers || {});
    const tmaInitData = (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) || '';
    if (tmaInitData && !headers.has('x-telegram-init-data')) {
      headers.set('x-telegram-init-data', tmaInitData);
    }

    const res = await fetch(input, {
      ...init,
      headers
    });
    const contentType = res.headers.get('content-type') || '';
    
    // If not JSON (e.g. HTML index.html fallback from SPA), handle gracefully
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.warn(`[safeFetchJson] Expected JSON but received non-JSON (${contentType}):`, text.slice(0, 100));
      return {
        success: false,
        error: `Server returned non-JSON response (${res.status})`
      };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`[safeFetchJson] Network or parse error:`, err);
    return {
      success: false,
      error: err?.message || 'Network error'
    };
  }
}

/**
 * Safe JSON POST utility
 */
export async function safePostJson<T = any>(
  url: string,
  body: any,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  return safeFetchJson<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    body: JSON.stringify(body),
    ...init
  });
}

/**
 * Safe JSON DELETE utility
 */
export async function safeDeleteJson<T = any>(
  url: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  return safeFetchJson<T>(url, {
    method: 'DELETE',
    ...(init || {})
  });
}

/**
 * Safe JSON PUT utility
 */
export async function safePutJson<T = any>(
  url: string,
  body: any,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  return safeFetchJson<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    body: JSON.stringify(body),
    ...init
  });
}

/**
 * Fallback loader for institutions when backend API is starting or unavailable
 */
export function getFallbackInstitutions(): Institution[] {
  return INITIAL_INSTITUTIONS;
}

/**
 * Fallback loader for user profiles
 */
export function getFallbackUserProfiles(tgUserId: number | string): AlumniProfile[] {
  const targetId = String(tgUserId);
  return INITIAL_ALUMNI_PROFILES.filter(p => {
    return p.userId === targetId || String(p.user?.tgUserId) === targetId;
  });
}
