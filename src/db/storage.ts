// src/db/storage.ts

export function getOrderImagesBucket(): string {
  // Defina no .env / GitHub Secrets (VITE_ORDER_IMAGES_BUCKET)
  // Ex: app_xxx_order_images
  const bucket = (import.meta as any).env?.VITE_ORDER_IMAGES_BUCKET?.trim();
  return bucket && bucket.length > 0 ? bucket : 'order_images';
}
