import { DirectoryResponse } from '../types';

interface CachedDirectoryEntry {
  data: DirectoryResponse;
  timestamp: number;
  institutionId: string;
  queryKey?: string;
}

const CACHE_PREFIX = 'tma_alumni_dir_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function buildQueryKey(queryParams?: Record<string, any>): string {
  if (!queryParams) return 'default';
  const keys = Object.keys(queryParams).sort();
  return keys
    .filter(k => queryParams[k] !== undefined && queryParams[k] !== '')
    .map(k => `${k}=${queryParams[k]}`)
    .join('&') || 'default';
}

export const DirectoryCache = {
  /**
   * Retrieves cached directory response for an institution if available
   */
  get(institutionId: string, queryParams?: Record<string, any>): DirectoryResponse | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const qKey = buildQueryKey(queryParams);
      const key = `${CACHE_PREFIX}${institutionId}_${qKey}`;
      let raw = localStorage.getItem(key);
      
      // Fallback to base institution cache if specific query isn't cached
      if (!raw) {
        raw = localStorage.getItem(`${CACHE_PREFIX}${institutionId}_default`);
      }
      if (!raw) return null;

      const parsed: CachedDirectoryEntry = JSON.parse(raw);
      if (!parsed || !parsed.data || !Array.isArray(parsed.data.alumni)) {
        return null;
      }

      return parsed.data;
    } catch (e) {
      console.warn('Failed to read directory cache from localStorage:', e);
      return null;
    }
  },

  /**
   * Retrieves detailed cache entry with timestamp and expiry
   */
  getEntry(institutionId: string, queryParams?: Record<string, any>): { data: DirectoryResponse; cachedAt: Date; isExpired: boolean } | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const qKey = buildQueryKey(queryParams);
      const key = `${CACHE_PREFIX}${institutionId}_${qKey}`;
      let raw = localStorage.getItem(key);
      if (!raw) {
        raw = localStorage.getItem(`${CACHE_PREFIX}${institutionId}_default`);
      }
      if (!raw) return null;

      const parsed: CachedDirectoryEntry = JSON.parse(raw);
      if (!parsed || !parsed.data || !Array.isArray(parsed.data.alumni)) {
        return null;
      }

      const now = Date.now();
      const age = now - parsed.timestamp;
      const isExpired = age > CACHE_EXPIRY_MS;

      return {
        data: parsed.data,
        cachedAt: new Date(parsed.timestamp),
        isExpired
      };
    } catch (e) {
      console.warn('Failed to read directory cache from localStorage:', e);
      return null;
    }
  },

  /**
   * Saves directory response for an institution into local storage
   */
  set(institutionId: string, queryParamsOrData: Record<string, any> | DirectoryResponse, maybeData?: DirectoryResponse): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      let data: DirectoryResponse;
      let qKey = 'default';

      if (maybeData) {
        data = maybeData;
        qKey = buildQueryKey(queryParamsOrData as Record<string, any>);
      } else {
        data = queryParamsOrData as DirectoryResponse;
      }

      const key = `${CACHE_PREFIX}${institutionId}_${qKey}`;
      const entry: CachedDirectoryEntry = {
        data,
        timestamp: Date.now(),
        institutionId,
        queryKey: qKey
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to save directory cache to localStorage:', e);
    }
  },

  /**
   * Clears directory cache for a given institution or all institutions
   */
  clear(institutionId?: string): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      if (institutionId) {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(`${CACHE_PREFIX}${institutionId}`)) {
            localStorage.removeItem(k);
          }
        });
      } else {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to clear directory cache:', e);
    }
  },

  /**
   * Formats relative cache time for user readability (e.g. "Cached 5m ago")
   */
  formatCachedTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Cached just now';
    if (diffMins < 60) return `Cached ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Cached ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Cached ${diffDays}d ago`;
  }
};

