/**
 * imageStorage.ts
 * Armazena imagens em memória (não podem ser JSON serializadas)
 * Referenciadas por orderNumber para recuperação no queue processor
 */

const imagesByOrderNumber = new Map<string, File[]>();

export function setOrderImages(orderNumber: string, files: File[]) {
  if (files.length > 0) {
    imagesByOrderNumber.set(orderNumber, files);
    console.log(`[ImageStorage] Saved ${files.length} images for order ${orderNumber}`);
  }
}

export function getOrderImages(orderNumber: string): File[] {
  return imagesByOrderNumber.get(orderNumber) || [];
}

export function clearOrderImages(orderNumber: string) {
  const had = imagesByOrderNumber.has(orderNumber);
  imagesByOrderNumber.delete(orderNumber);
  if (had) {
    console.log(`[ImageStorage] Cleared images for order ${orderNumber}`);
  }
}
