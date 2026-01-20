// src/utils/processOfflineQueue.ts
import { supabase } from '@/db/supabase';
import { getOrderImagesBucket } from '@/db/storage';
import {
  getPendingTasks,
  markTaskDone,
  markTaskFailed,
  markTaskProcessing,
  type OfflineTask,
  isOnlineNow,
} from './offlineQueue';

// Evita rodar múltiplos processamentos ao mesmo tempo
let running = false;

async function processCreateMessage(task: Extract<OfflineTask, { type: 'CREATE_MESSAGE' }>) {
  const p = task.payload;

  const { error } = await supabase.from('messages').insert({
    order_id: p.order_id,
    sender_id: p.sender_id,
    content: p.content,
    image_url: p.image_url ?? null,
  });

  if (error) throw error;
}

async function processUploadOrderImage(task: Extract<OfflineTask, { type: 'UPLOAD_ORDER_IMAGE' }>) {
  const p = task.payload;

  // ✅ bucket sempre vem do helper (e você já confirmou o bucket certo no Supabase)
  const bucket = getOrderImagesBucket();

  // 1) upload blob -> storage
  // path único para evitar colisão
  const storagePath = `${p.orderId}_${Date.now()}_${p.fileName}`;

  const { data: up, error: upErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, p.blob, {
      contentType: p.mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (upErr) throw upErr;

  // 2) url pública
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(up.path);
  const imageUrl = urlData.publicUrl;

  // 3) grava no banco
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userRes.user) throw new Error('Usuário não autenticado');

  const { error: dbErr } = await supabase.from('order_images').insert({
    order_id: p.orderId,
    image_url: imageUrl,
    description: p.description ?? null,
    uploaded_by: userRes.user.id,
  });

  if (dbErr) throw dbErr;
}

export async function processOfflineQueue(options?: { maxTasks?: number; maxAttempts?: number }) {
  if (running) return;
  running = true;

  const maxTasks = options?.maxTasks ?? 25;
  const maxAttempts = options?.maxAttempts ?? 10;

  try {
    // se está offline, nem tenta
    if (!isOnlineNow()) return;

    const tasks = (await getPendingTasks()).slice(0, maxTasks);
    if (!tasks.length) return;

    for (const task of tasks) {
      // evita loop infinito
      if ((task.attempts || 0) >= maxAttempts) continue;

      try {
        await markTaskProcessing(task.id);

        if (task.type === 'CREATE_MESSAGE') {
          await processCreateMessage(task as any);
        } else if (task.type === 'UPLOAD_ORDER_IMAGE') {
          await processUploadOrderImage(task as any);
        } else {
          throw new Error(`Tipo de task não suportado: ${(task as any).type}`);
        }

        await markTaskDone(task.id);
      } catch (err) {
        console.error('❌ Falha ao processar tarefa offline:', task.type, task.id, err);
        await markTaskFailed(task.id, err);
        // não explode o loop; vai para próxima
      }
    }
  } finally {
    running = false;
  }
}
