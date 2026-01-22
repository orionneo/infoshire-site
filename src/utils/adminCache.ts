// src/utils/adminCache.ts
const KEY = 'infoshire_admin_cache_v1';

export type AdminCacheData = {
  // deixe flexível pra não quebrar
  [k: string]: any;
};

export function loadAdminCache(): AdminCacheData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAdminCache(data: AdminCacheData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearAdminCache(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
