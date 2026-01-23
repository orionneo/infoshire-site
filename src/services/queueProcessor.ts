/**
 * queueProcessor.ts
 * Processa fila de operações pendentes imediatamente ao voltar (focus, online, etc)
 * Garante retry inteligente e sem spam
 */

import { getPendingOpsDB, PendingOp } from './pendingOps';
import { createServiceOrder, uploadOrderImage } from '@/db/api';
import { logAiEvent, logAiError } from './debugLogger';
import { getOrderImages, clearOrderImages } from './imageStorage';

export type ProcessReason = 'app_start' | 'online' | 'visibility' | 'focus' | 'user_click' | 'interval';

interface ProcessOptions {
  reason: ProcessReason;
  maxRetries?: number;
}

let processingInProgress = false;
let lastProcessTime = 0;
const MIN_PROCESS_INTERVAL = 1000; // Mínimo 1s entre processamentos

async function shouldRetry(op: PendingOp, maxRetries = 5): Promise<boolean> {
  if (op.status === 'done' || op.status === 'partial_done') return false;
  if (op.attempts >= maxRetries) return false;
  return true;
}

function getRetryDelay(attempt: number, reason: ProcessReason): number {
  // Se voltou (focus, visibility, online), ser agressivo
  const isAggressive = ['focus', 'visibility', 'online'].includes(reason);
  
  if (isAggressive) {
    // Retry rápido: 0s, 0.5s, 1s, 2s, 4s
    return Math.min(Math.pow(2, attempt - 1) * 250, 4000);
  }
  
  // Normal backoff: 1s, 2s, 4s, 8s
  return Math.min(Math.pow(2, attempt) * 1000, 30000);
}

async function processOp(op: PendingOp, reason: ProcessReason): Promise<void> {
  const db = await getPendingOpsDB();
  
  try {
    console.log(`[QueueProcessor] Processing op: ${op.opId}, attempt: ${op.attempts + 1}`);
    
    await db.update(op.opId, {
      status: 'sending',
      lastAttemptAt: Date.now(),
      attempts: op.attempts + 1,
    });

    await logAiEvent('QueueProcessor', 'send_start', {
      opId: op.opId,
      order_number: op.order_number,
      attempt: op.attempts + 1,
    });

    // Enviar para Supabase com timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: 30s exceeded')), 30000)
    );

    try {
      const order = await Promise.race([
        createServiceOrder(op.payload),
        timeoutPromise,
      ]) as any;

      console.log(`[QueueProcessor] ✅ Order created:`, order.id, order.order_number);

      // ✅ Upload de imagens (em background, não bloqueia)
      const images = getOrderImages(op.order_number);
      if (images.length > 0) {
        console.log(`[QueueProcessor] 📸 Uploading ${images.length} images for order ${order.id}`);
        (async () => {
          try {
            await Promise.all(
              images.map((file, index) =>
                uploadOrderImage(order.id, file, `Foto ${index + 1}`)
              )
            );
            console.log(`[QueueProcessor] ✅ Images uploaded successfully`);
          } catch (err) {
            console.warn(`[QueueProcessor] ⚠️ Image upload failed (but order exists):`, err);
          } finally {
            clearOrderImages(op.order_number);
          }
        })();
      }

      await db.update(op.opId, {
        status: 'done',
        order_id: order.id,
      });

      await logAiEvent('QueueProcessor', 'send_success', {
        opId: op.opId,
        order_number: op.order_number,
        order_id: order.id,
        attempts: op.attempts + 1,
      });

      console.log(`✅ [QueueProcessor] Op done: ${op.opId}`);
    } catch (sendError: any) {
      console.error(`[QueueProcessor] Order creation error:`, sendError);
      // Limpar imagens se a OS falhou
      clearOrderImages(op.order_number);
      throw sendError;
    }
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error(`[QueueProcessor] Error processing op ${op.opId}:`, errorMsg);

    await logAiError('QueueProcessor', error, {
      opId: op.opId,
      order_number: op.order_number,
      attempt: op.attempts + 1,
    });

    // Decidir se retry ou marcar como erro final
    const shouldRetryNow = await shouldRetry(op);
    
    if (shouldRetryNow) {
      const retryDelay = getRetryDelay(op.attempts + 1, reason);
      
      await db.update(op.opId, {
        status: 'pending',
        lastError: errorMsg,
      });

      await logAiEvent('QueueProcessor', 'retry_scheduled', {
        opId: op.opId,
        order_number: op.order_number,
        delayMs: retryDelay,
        nextAttempt: op.attempts + 2,
      });

      console.warn(
        `⚠️ [QueueProcessor] Retry scheduled for ${op.opId} in ${retryDelay}ms (attempt ${op.attempts + 2})`
      );
    } else {
      await db.update(op.opId, {
        status: 'error',
        lastError: errorMsg,
      });

      await logAiError('QueueProcessor', error, {
        opId: op.opId,
        order_number: op.order_number,
        attemptsFailed: op.attempts + 1,
      });

      console.error(`❌ [QueueProcessor] Op failed after retries: ${op.opId}`);
    }
  }
}

/**
 * Processa fila de operações pendentes
 * Chamado imediatamente ao voltar (focus, online, visibilitychange)
 */
export async function processPendingQueue(opts: ProcessOptions): Promise<void> {
  const { reason } = opts;

  // ✅ SURGICAL FIX: focus, visibility, user_click devem processar IMEDIATAMENTE
  // Apenas interval/app_start/online respeitam throttle
  const needsImmediateProcess = ['focus', 'visibility', 'user_click'].includes(reason);
  const now = Date.now();
  
  if (!needsImmediateProcess) {
    // Debounce: não processar muito frequentemente (para interval/online)
    if (now - lastProcessTime < MIN_PROCESS_INTERVAL) {
      console.log(`[QueueProcessor] Skipping throttle (too soon, reason: ${reason})`);
      await logAiEvent('QueueProcessor', 'queue_processor_throttled', { reason });
      return;
    }
  } else {
    // Focus/visibility/user_click: log que foi processado sem throttle
    console.info(`[QueueProcessor] 🚀 IMMEDIATE PROCESS (NO THROTTLE): reason=${reason}`);
    await logAiEvent('QueueProcessor', 'queue_processor_immediate', { reason });
  }

  if (processingInProgress) {
    console.log(`[QueueProcessor] Already processing (reason: ${reason})`);
    return;
  }

  processingInProgress = true;
  lastProcessTime = now;

  try {
    const db = await getPendingOpsDB();
    const pending = await db.getAll('pending');

    if (pending.length === 0) {
      console.log(`[QueueProcessor] No pending ops (reason: ${reason})`);
      return;
    }

    await logAiEvent('QueueProcessor', 'process_start', {
      reason,
      count: pending.length,
    });

    console.log(`[QueueProcessor] Processing ${pending.length} pending ops (reason: ${reason})`);

    // Processar em paralelo (max 3 concurrent)
    const concurrent = 3;
    for (let i = 0; i < pending.length; i += concurrent) {
      const batch = pending.slice(i, i + concurrent);
      await Promise.all(batch.map((op) => processOp(op, reason)));
    }

    await logAiEvent('QueueProcessor', 'process_done', {
      reason,
      count: pending.length,
    });

    console.log(`✅ [QueueProcessor] Done (reason: ${reason})`);
  } catch (error) {
    console.error(`❌ [QueueProcessor] Error:`, error);
    await logAiError('QueueProcessor', error, {
      reason,
    });
  } finally {
    processingInProgress = false;
  }
}

/**
 * Setup auto-processing triggers
 * Chamar uma vez ao iniciar a app
 */
export function setupQueueProcessing(): void {
  console.log('[QueueProcessor] Setting up auto-processing triggers');

  // 1. App startup
  processPendingQueue({ reason: 'app_start' }).catch(console.error);

  // 2. Online event
  window.addEventListener('online', () => {
    console.log('[QueueProcessor] Online event detected');
    processPendingQueue({ reason: 'online' }).catch(console.error);
  });

  // 3. Visibility change (voltou da aba)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('[QueueProcessor] Visibility changed: visible');
      processPendingQueue({ reason: 'visibility' }).catch(console.error);
    }
  });

  // 4. Focus event
  window.addEventListener('focus', () => {
    console.log('[QueueProcessor] Focus event detected');
    processPendingQueue({ reason: 'focus' }).catch(console.error);
  });

  // 5. Interval fallback (15s) - caso os eventos acima não funcionem
  setInterval(() => {
    processPendingQueue({ reason: 'interval' }).catch(console.error);
  }, 15000);
}

/**
 * Força processamento imediato (para testing/manual)
 */
export async function forceProcessQueue(): Promise<void> {
  console.log('[QueueProcessor] Manual force process');
  await processPendingQueue({ reason: 'user_click' });
}
