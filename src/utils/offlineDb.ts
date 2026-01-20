// src/utils/offlineDb.ts
export type OfflineTaskType = 'CREATE_MESSAGE' | 'UPLOAD_IMAGE';

export type OfflineTask =
  | {
      id: string;
      type: 'CREATE_MESSAGE';
      createdAt: number;
      retries: number;
      payload: {
        order_id: string;
        sender_id: string;
        content: string;
        image_url?: string | null;
      };
    }
  | {
      id: string;
      type: 'UPLOAD_IMAGE';
      createdAt: number;
      retries: number;
      payload: {
        orderId: string;
        description?: string;
        fileName: string;
        mimeType: string;
        // O Blob vai separado no store "blobs"
      };
    };

const DB_NAME = 'infoshire_offline_db';
const DB_VERSION = 1;

const STORE_TASKS = 'tasks';
const STORE_BLOBS = 'blobs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        const tasks = db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
        tasks.createIndex('createdAt', 'createdAt', { unique: false });
        tasks.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'id' }); // id = taskId
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.onabort = () => reject(transaction.error);
  });
}

export async function dbPutTask(task: OfflineTask): Promise<void> {
  const db = await openDb();
  await tx(db, STORE_TASKS, 'readwrite', (store) => store.put(task));
  db.close();
}

export async function dbGetAllTasks(): Promise<OfflineTask[]> {
  const db = await openDb();
  const tasks = await tx(db, STORE_TASKS, 'readonly', (store) => store.getAll());
  db.close();
  return Array.isArray(tasks) ? tasks : [];
}

export async function dbDeleteTask(taskId: string): Promise<void> {
  const db = await openDb();
  await tx(db, STORE_TASKS, 'readwrite', (store) => store.delete(taskId));
  db.close();
}

export async function dbUpdateTaskRetries(taskId: string, retries: number): Promise<void> {
  const db = await openDb();

  const task = await tx<OfflineTask | undefined>(db, STORE_TASKS, 'readonly', (store) => store.get(taskId));
  if (task) {
    const updated = { ...task, retries };
    await tx(db, STORE_TASKS, 'readwrite', (store) => store.put(updated));
  }

  db.close();
}

export async function dbPutBlob(taskId: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await tx(db, STORE_BLOBS, 'readwrite', (store) => store.put({ id: taskId, blob }));
  db.close();
}

export async function dbGetBlob(taskId: string): Promise<Blob | null> {
  const db = await openDb();
  const row = await tx<any>(db, STORE_BLOBS, 'readonly', (store) => store.get(taskId));
  db.close();
  return row?.blob ?? null;
}

export async function dbDeleteBlob(taskId: string): Promise<void> {
  const db = await openDb();
  await tx(db, STORE_BLOBS, 'readwrite', (store) => store.delete(taskId));
  db.close();
}
