// src/db/storage.ts
import { STORAGE_BUCKETS } from '@/config/storage';

export function getOrderImagesBucket(): string {
  return STORAGE_BUCKETS.ORDER_IMAGES;
}

export function getMessageImagesBucket(): string {
  return STORAGE_BUCKETS.MESSAGE_IMAGES;
}

export function getEquipmentPhotosBucket(): string {
  return STORAGE_BUCKETS.EQUIPMENT_PHOTOS;
}
