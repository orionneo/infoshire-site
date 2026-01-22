import { safeStorage } from '@/utils/safeStorage';

const memoryStore = new Map<string, string>();

const getItem = (key: string): string | null => {
  if (memoryStore.has(key)) {
    return memoryStore.get(key) ?? null;
  }

  return safeStorage.getItem(key);
};

const setItem = (key: string, value: string): void => {
  memoryStore.set(key, value);
  safeStorage.setItem(key, value);
};

const removeItem = (key: string): void => {
  memoryStore.delete(key);
  safeStorage.removeItem(key);
};

export const secureTabStorage = {
  getItem,
  setItem,
  removeItem,
};
