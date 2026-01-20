// src/utils/offlineQueue.ts
import { v4 as uuid } from 'uuid';
import type { OfflineTask } from './offlineDb';
import {
  dbDeleteBlob,
  dbDeleteTask,
  dbGetAllTasks,
  dbGetBlob,
  dbPutBlob,
  dbPutTask,
  dbUpdateTaskRetries,
} from './offlineDb';

export type { OfflineTask };
export type OfflineTaskType = OfflineTask['type'];

export type EnqueueCreateMessagePayload = Extract<OfflineTask, { type: 'CREATE_MESSAGE' }>['payload'];
export type EnqueueUploadImagePayload = Extract<OfflineTask, { type: 'UPLOAD_IMAGE' }>['payload'];

export function isOnlineNow(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Adiciona uma tarefa offline (IndexedDB) e retorna o id.
 * Exportamos 2 nomes (enqueueTask e addOfflineTask) pra evitar quebra no projeto.
 */
export async function enqueueTask(task: Omit<OfflineTask, 'id' | 'createdAt' | 'retries'>): Promise<string> {
  const id = uuid();

  const full: OfflineTask = {
    ...(task as any),
    id,
    createdAt: Date.now(),
    retries: 0,
  };

  await dbPutTask(full);
  return id;
}

// Alias compatível com o que você importou no api.ts
export const addOfflineTask = enqueueTask;

/**
 * Helpers específicos (mais legíveis no api.ts)
 */
export async function enqueueCreateMessage(payload: EnqueueCreateMessagePayload): Promise<string> {
  return enqueueTask({ type: 'CREATE_MESSAGE', payload });
}

export async function enqueueUploadImage(
  payload: EnqueueUploadImagePayload,
  blob: Blob
): Promise<string> {
  const id = await enqueueTask({ type: 'UPLOAD_IMAGE', payload });
  await dbPutBlob(id, blob);
  return id;
}

/**
 * Leitura de fila
 */
export async function getAllTasks(): Promise<OfflineTask[]> {
  return await dbGetAllTasks();
}

export async function getPendingTasks(): Promise<OfflineTask[]> {
  const tasks = await dbGetAllTasks();
  // Aqui você pode filtrar “done/processing” no futuro se quiser.
  // Por enquanto, tudo que está salvo é “pendente”.
  return tasks.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * “Marcar” task como processando/done/failed:
 * (Neste step 1, deixamos simples: só mexe retries e remove quando concluir)
 */
export async function markTaskProcessing(_taskId: string): Promise<void> {
  // opcional: você pode implementar status depois (step 2/3)
  return;
}

export async function markTaskDone(taskId: string): Promise<void> {
  // remove task e blob (se existir)
  await dbDeleteTask(taskId);
  await dbDeleteBlob(taskId);
}

export async function markTaskFailed(taskId: string): Promise<void> {
  const tasks = await dbGetAllTasks();
  const t = tasks.find((x) => x.id === taskId);
  const retries = (t?.retries ?? 0) + 1;
  await dbUpdateTaskRetries(taskId, retries);
}

export async function getTaskBlob(taskId: string): Promise<Blob | null> {
  return await dbGetBlob(taskId);
}

export async function removeTask(taskId: string): Promise<void> {
  await dbDeleteTask(taskId);
  await dbDeleteBlob(taskId);
}
