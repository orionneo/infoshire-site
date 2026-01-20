// src/utils/adminCache.ts
import type { ServiceOrderWithClient, Profile } from '@/types/types';

const KEY = 'infoshire_admin_cache_v1';

export function saveAdminCache(data: { orders: ServiceOrderWithClient[]; clients: Profile[] }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}

export function loadAdminCache(): { orders: ServiceOrderWithClient[]; clients: Profile[] } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
    };
  } catch {
    return null;
  }
}
