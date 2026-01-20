// src/utils/processOfflineQueue.ts
import { supabase } from '@/db/supabase';
import { getMessageImagesBucket, getOrderImagesBucket } from '@/db/storage';
import {
  getPendingTasks,
  markTaskDone,
  markTaskFailed,
  markTaskProcessing,
  getTaskBlob,
  isOnlineNow,
  type OfflineTask,
} from './offlineQueue';

// Evita rodar múltiplos processamentos ao mesmo tempo
let running = false;

function shouldRetry(err: any) {
  const msg = String(err?.message ?? '');
  // rede/offline/timeouts → retry
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('timeout') ||
    msg.includes('ECONN') ||
    msg.includes('AbortError')
  );
}

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
  const blob = await getTaskBlob(task.id);
  if (!blob) throw new Error('Blob não encontrado para UPLOAD_ORDER_IMAGE');

  const bucket = getOrderImagesBucket();
  const storagePath = `${p.orderId}_${Date.now()}_${p.fileName}`;

  const { data: up, error: upErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, blob, {
      contentType: p.mimeType,
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) throw upErr;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(up.path);
  const imageUrl = urlData.publicUrl;

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

async function processUploadMessageImage(task: Extract<OfflineTask, { type: 'UPLOAD_MESSAGE_IMAGE' }>) {
  const p = task.payload;
  const blob = await getTaskBlob(task.id);
  if (!blob) throw new Error('Blob não encontrado para UPLOAD_MESSAGE_IMAGE');

  const bucket = getMessageImagesBucket();
  const storagePath = `${Date.now()}_${p.fileName}`;

  const { data: up, error: upErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, blob, {
      contentType: p.mimeType,
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) throw upErr;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(up.path);
  const imageUrl = urlData.publicUrl;

  const { error } = await supabase.from('messages').insert({
    order_id: p.order_id,
    sender_id: p.sender_id,
    content: p.content ?? '[Imagem]',
    image_url: imageUrl,
  });
  if (error) throw error;
}

async function processCreateServiceOrder(task: Extract<OfflineTask, { type: 'CREATE_SERVICE_ORDER' }>) {
  const o = task.payload;

  // 1) gera número de OS (online-only)
  const { data: orderNumber, error: numberError } = await supabase.rpc('generate_order_number');
  if (numberError) throw numberError;

  // 2) cria service_orders com ID vindo do client (idempotente por ID)
  const { error: insErr } = await supabase.from('service_orders').insert({
    id: o.id,
    client_id: o.client_id,
    equipment: o.equipment,
    serial_number: o.serial_number ?? null,
    entry_date: o.entry_date || new Date().toISOString(),
    equipment_photo_url: o.equipment_photo_url ?? null,
    problem_description: o.problem_description,
    estimated_completion: o.estimated_completion ?? null,
    has_multiple_items: o.has_multiple_items || false,
    order_number: orderNumber,
  });
  if (insErr) throw insErr;

  // 3) histórico inicial
  const { error: histErr } = await supabase.from('order_status_history').insert({
    order_id: o.id,
    status: 'received',
    notes: 'Ordem de serviço criada',
    created_by: o.client_id,
  });
  if (histErr) throw histErr;

  // 4) itens adicionais (se tiver)
  if (o.items && o.items.length > 0) {
    const rows = o.items.map((it) => ({
      service_order_id: o.id,
      equipment: it.equipment,
      serial_number: it.serial_number || null,
      description: it.description || null,
    }));

    const { error: itemsErr } = await supabase.from('service_order_items').insert(rows);
    if (itemsErr) throw itemsErr;
  }
}

export async function processOfflineQueue(options?: { maxTasks?: number; maxAttempts?: number }) {
  if (running) return;
  running = true;

  const maxTasks = options?.maxTasks ?? 25;
  const maxAttempts = options?.maxAttempts ?? 10;

  try {
    // ✅ Sem “verificação de conexão” no UI.
    // Aqui é só para evitar tentar fetch quando sabemos que está offline.
    if (!isOnlineNow()) return;

    const tasks = (await getPendingTasks()).slice(0, maxTasks);
    if (!tasks.length) return;

    for (const task of tasks) {
      if ((task.retries || 0) >= maxAttempts) continue;

      try {
        await markTaskProcessing(task.id);

        if (task.type === 'CREATE_MESSAGE') {
          await processCreateMessage(task as any);
        } else if (task.type === 'UPLOAD_ORDER_IMAGE') {
          await processUploadOrderImage(task as any);
        } else if (task.type === 'UPLOAD_MESSAGE_IMAGE') {
          await processUploadMessageImage(task as any);
        } else if (task.type === 'CREATE_SERVICE_ORDER') {
          await processCreateServiceOrder(task as any);
        } else {
          throw new Error(`Tipo de task não suportado: ${(task as any).type}`);
        }

        await markTaskDone(task.id);
      } catch (err: any) {
        console.error('❌ Falha ao processar tarefa offline:', task.type, task.id, err);

        // Se for erro “definitivo”, ainda marca failed (incrementa retries) e segue
        await markTaskFailed(task.id, err);

        // Se não for retryable, não faz nada extra; mantém na fila até estourar maxAttempts
        if (!shouldRetry(err)) {
          // não derruba loop
        }
      }
    }
  } finally {
    running = false;
  }
}
