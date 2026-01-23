/**
 * pendingOps.ts
 * Fila durável com IndexedDB para operações offline-first
 * Garante que OS criadas em background sejam processadas imediatamente ao retornar
 */

export interface PendingOp {
  opId: string;
  kind: 'create_os'; // future-proof: pode ser 'update_os', etc
  order_number: string;
  payload: any; // dados da OS
  status: 'pending' | 'sending' | 'done' | 'error' | 'partial_done';
  attempts: number;
  createdAt: number; // timestamp
  updatedAt: number;
  lastError?: string;
  lastAttemptAt?: number;
  order_id?: string; // UUID da OS criada no Supabase
}

const DB_NAME = 'infoshire_admin_db';
const STORE_NAME = 'pending_ops';
const DB_VERSION = 1;

class PendingOpsDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
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
          console.log('[PendingOpsDB] Store created');
        }
      };
    });
  }

  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    const tx = this.db!.transaction([STORE_NAME], mode);
    return tx.objectStore(STORE_NAME);
  }

  async enqueue(op: PendingOp): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(op);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async update(opId: string, updates: Partial<PendingOp>): Promise<void> {
    const store = await this.getStore('readwrite');
    const existing = await this.getById(opId);
    if (!existing) throw new Error(`Op not found: ${opId}`);
    
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    
    return new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getById(opId: string): Promise<PendingOp | null> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.get(opId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getByOrderNumber(order_number: string): Promise<PendingOp | null> {
    const store = await this.getStore();
    const index = store.index('order_number');
    return new Promise((resolve, reject) => {
      const request = index.get(order_number);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAll(status?: string): Promise<PendingOp[]> {
    const store = await this.getStore();
    const query = status !== undefined ? store.index('status').getAll(status) : store.getAll();
    
    return new Promise((resolve, reject) => {
      const request = query;
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async delete(opId: string): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(opId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async count(): Promise<number> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// Singleton
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

  const db = await getPendingOpsDB();
  await db.enqueue(op);
  console.log(`[PendingOps] Enqueued op: ${opId} (order_number: ${order_number})`);
  return op;
}
