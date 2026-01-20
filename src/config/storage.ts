// src/config/storage.ts
const env = (import.meta as any).env || {};

function readEnv(name: string, fallback: string) {
  const v = String(env?.[name] ?? '').trim();
  return v.length ? v : fallback;
}

/**
 * ✅ Buckets controlados via VITE_* (GitHub Secrets / .env)
 * Assim você troca buckets sem tocar código.
 */
export const STORAGE_BUCKETS = {
  ORDER_IMAGES: readEnv('VITE_ORDER_IMAGES_BUCKET', 'order_images'),
  MESSAGE_IMAGES: readEnv('VITE_MESSAGE_IMAGES_BUCKET', 'messages_images'),
  EQUIPMENT_PHOTOS: readEnv('VITE_EQUIPMENT_PHOTOS_BUCKET', 'equipment_photos'),
};
