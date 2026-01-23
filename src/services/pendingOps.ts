/**
 * pendingOps.ts - RESILIENT VERSION
 * Fila durável com retry automático em InvalidStateError
 * Garante enqueue sempre funciona, mesmo com connection closing
 */

import { logAiError } from './debugLogger';

export interface PendingOp {
  opId: string;
  kind: 'create_os';
  order_number: string;
  payload: any;
  status: 'pending' | 'sending' | 'done' | 'error' | 'partial_done';
  attempts: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
  lastAttemptAt?: number;
  order_id?: string;
}

export const inMemoryPendingOps: PendingOp[] = [];

const DB_NAME = 'infoshire_admin_db';
const STORE_NAME = 'pending_ops';
const DB_VERSION = 1;

// ✅ Helper: detectar se erro é IDB closing/invalid
function isIDBClosingError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('database connection is closing') ||
    msg.includes('invalidstateerror') ||
    msg.includes('transactioninactiveerror') ||
    err.name === 'InvalidStateError' ||
    err.name === 'TransactionInactiveError'
  );
}

class PendingOpsDB {
  private db: IDBDatabase | null = null;
  private isInitializing = false;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.isInitializing) {
      // Aguardar init em progresso
      let maxWait = 50;
      while (this.isInitializing && maxWait-- > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.db) return;
    }

    this.isInitializing = true;
    try {
      return await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('[PendingOpsDB] Failed to open:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('[PendingOpsDB] Initialized');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'opId' });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('order_number', 'order_number', { unique: false });
          }
        };
      });
    } finally {
      this.isInitializing = false;
    }
  }

  // ✅ Wrapper: executa função com retry em IDB closing
  private async withDB<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
    try {
      if (!this.db) await this.init();
      return await fn(this.db!);
    } catch (err) {
      if (isIDBClosingError(err)) {
        console.warn('[PendingOpsDB] Connection closing, reopening...');
        try {
          this.db?.close();
        } catch (e) {
          // ignore close error
        }
        this.db = null;
        await this.init();
        // Retry 1x
        return await fn(this.db!);
      }
      throw err;
    }
  }

  async enqueue(op: PendingOp): Promise<void> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.add(op);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  async update(opId: string, updates: Partial<PendingOp>): Promise<void> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const getRequest = store.get(opId);

            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => {
              const existing = getRequest.result as PendingOp | undefined;
              if (!existing) {
                reject(new Error(`Op not found: ${opId}`));
                return;
              }

              const updated = { ...existing, ...updates, updatedAt: Date.now() };
              const putRequest = store.put(updated);
              putRequest.onerror = () => reject(putRequest.error);
              putRequest.onsuccess = () => resolve();
            };
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  async getById(opId: string): Promise<PendingOp | null> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(opId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  async getByOrderNumber(order_number: string): Promise<PendingOp | null> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('order_number');
            const request = index.get(order_number);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  async getAll(status?: string): Promise<PendingOp[]> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request =
              status !== undefined ? store.index('status').getAll(status) : store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  async delete(opId: string): Promise<void> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(opId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  async clear(): Promise<void> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          } catch (err) {
            reject(err);
          }
        })
    );
  }

  async count(): Promise<number> {
    return this.withDB(
      async (db) =>
        new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.count();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          } catch (err) {
            reject(err);
          }
        })
    );
  }
}

let instance: PendingOpsDB | null = null;

export async function getPendingOpsDB(): Promise<PendingOpsDB> {
  if (!instance) {
    instance = new PendingOpsDB();
    await instance.init();
  }
  return instance;
}

export async function createPendingOp(
  opId: string,
  order_number: string,
  payload: any
): Promise<PendingOp> {
  const now = Date.now();
  const op: PendingOp = {
    opId,
    kind: 'create_os',
    order_number,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const db = await getPendingOpsDB();
    await db.enqueue(op);
    console.log(`[PendingOps] Enqueued: ${opId}`);
    return op;
  } catch (err) {
    inMemoryPendingOps.push(op);
    await logAiError('PendingOps', err, {
      opId,
      order_number,
      reason: 'enqueue_failed_fallback',
      fallback: 'in_memory',
    });
    return op;
  }
}
