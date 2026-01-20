// src/utils/idb.ts
type AnyObject = Record<string, any>;

export type IDBStoreConfig = {
  dbName: string;
  version: number;
  stores: Array<{ name: string; keyPath: string }>;
};

function openDb(config: IDBStoreConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(config.dbName, config.version);

    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of config.stores) {
        if (!db.objectStoreNames.contains(s.name)) {
          db.createObjectStore(s.name, { keyPath: s.keyPath });
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  config: IDBStoreConfig,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDb(config);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let req: IDBRequest<T> | undefined;
    try {
      const r = fn(store);
      req = r as IDBRequest<T> | undefined;
    } catch (e) {
      reject(e);
      return;
    }

    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);

    if (req) {
      req.onerror = () => reject(req.error);
    }
  });
}

export function createIdbStore(config: IDBStoreConfig) {
  return {
    async get<T = AnyObject>(storeName: string, key: string): Promise<T | null> {
      const res = await withStore<T>(config, storeName, 'readonly', (s) => s.get(key));
      return (res as T) ?? null;
    },

    async set<T = AnyObject>(storeName: string, value: T): Promise<void> {
      await withStore(config, storeName, 'readwrite', (s) => s.put(value as any));
    },

    async del(storeName: string, key: string): Promise<void> {
      await withStore(config, storeName, 'readwrite', (s) => s.delete(key));
    },

    async getAll<T = AnyObject>(storeName: string): Promise<T[]> {
      const res = await withStore<T[]>(config, storeName, 'readonly', (s) => s.getAll());
      return Array.isArray(res) ? res : [];
    },
  };
}
