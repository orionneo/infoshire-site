import { supabase, ensureFreshSession } from '@/db/supabase';
import { getPendingTasks, markTaskDone, markTaskFailed, type OfflineTask } from './offlineQueue';

/**
 * Processa fila offline de forma SEGURA:
 * - Não tenta criar OS offline (isso gera 401/RLS e deixa o app "travado").
 * - Remove tarefas antigas de CREATE_SERVICE_ORDER para parar retries infinitos.
 * - Mantém apenas upload de imagens e outras tarefas que você queira suportar.
 */
export async function processOfflineQueue() {
  const tasks = await getPendingTasks();
  if (!tasks.length) return;

  for (const task of tasks) {
    try {
      // ✅ Se a sessão expirou, pare aqui para evitar loops.
      try {
        if (document.visibilityState !== 'visible') return;
        await ensureFreshSession(60);
      } catch (e: any) {
        await markTaskFailed(task.id, e?.message || 'Sessão expirada. Faça login para sincronizar.');
        // removemos da fila para não loopar eternamente
        await markTaskDone(task.id);
        continue;
      }

      switch (task.type) {
        case 'CREATE_SERVICE_ORDER': {
          // Não suportamos mais (admin deve criar online).
          await markTaskFailed(task.id, 'CREATE_SERVICE_ORDER offline desativado (crie online).');
          await markTaskDone(task.id);
          break;
        }

        case 'UPLOAD_ORDER_IMAGE': {
          await processUploadOrderImage(task);
          await markTaskDone(task.id);
          break;
        }

        default: {
          // Se aparecer uma tarefa desconhecida, marque como falha e remova
          await markTaskFailed(task.id, `Tipo de tarefa não suportado: ${task.type}`);
          await markTaskDone(task.id);
        }
      }
    } catch (err: any) {
      // Se for erro de auth/RLS, remova para não ficar "eterno"
      const msg = String(err?.message ?? err);
      await markTaskFailed(task.id, msg);
      await markTaskDone(task.id);
    }
  }
}

async function processUploadOrderImage(task: OfflineTask) {
  // payload esperado: { bucket: string, path: string, base64: string, contentType?: string }
  const payload = task.payload as any;
  const bucket: string = payload.bucket;
  const path: string = payload.path;
  const base64: string = payload.base64;
  const contentType: string = payload.contentType ?? 'image/webp';

  if (!bucket || !path || !base64) {
    throw new Error('UPLOAD_ORDER_IMAGE payload inválido');
  }

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: contentType });

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType,
    cacheControl: '3600',
  });
  if (error) throw error;
}
