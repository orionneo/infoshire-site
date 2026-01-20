// src/utils/offlineQueueRunner.ts
import { processOfflineQueue } from './processOfflineQueue';

let timer: number | null = null;

export function startOfflineProcessor(intervalMs: number = 15000) {
  if (timer) return;

  // tenta logo no começo
  processOfflineQueue();

  timer = window.setInterval(() => {
    processOfflineQueue();
  }, intervalMs);
}

export function stopOfflineProcessor() {
  if (!timer) return;
  window.clearInterval(timer);
  timer = null;
}
