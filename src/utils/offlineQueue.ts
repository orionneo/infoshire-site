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

export function isOnlineNow(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export async function addOfflineTask(task: Omit<OfflineTask, 'id' | 'createdAt' | 'retries'>): Promise<string> {
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

export async function getAllTasks(): Promise<OfflineTask[]> {
  return await dbGetAllTasks();
}

export async function getPendingTasks(): Promise<OfflineTask[]> {
  const tasks = await dbGetAllTasks();
  return tasks.sort((a, b) => a.createdAt - b.createdAt);
}

export async function markTaskProcessing(_taskId: string): Promise<void> {
  return;
}

export async function markTaskDone(taskId: string): Promise<void> {
  await dbDeleteTask(taskId);
  await dbDeleteBlob(taskId);
}

export async function markTaskFailed(taskId: string, _err?: any): Promise<void> {
  const tasks = await dbGetAllTasks();
  const t = tasks.find((x) => x.id === taskId);
  const retries = (t?.retries ?? 0) + 1;
  await dbUpdateTaskRetries(taskId, retries);
}

export async function getTaskBlob(taskId: string): Promise<Blob | null> {
  return await dbGetBlob(taskId);
}

export async function attachBlob(taskId: string, blob: Blob): Promise<void> {
  await dbPutBlob(taskId, blob);
}

export async function removeTask(taskId: string): Promise<void> {
  await dbDeleteTask(taskId);
  await dbDeleteBlob(taskId);
}
