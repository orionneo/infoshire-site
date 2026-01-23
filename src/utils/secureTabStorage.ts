import { safeStorage } from '@/utils/safeStorage';

const memoryStore = new Map<string, string>();

const getItem = (key: string): string | null => {
  try {
    if (memoryStore.has(key)) {
      return memoryStore.get(key) ?? null;
    }

    return safeStorage.getItem(key);
  } catch (error) {
    // Storage blocked - return null silently
    return null;
  }
};

let storageBlocked = false;

const setItem = (key: string, value: string): boolean => {
  if (storageBlocked) {
    return false;
  }

  try {
    const stored = safeStorage.setItem(key, value);
    if (!stored) {
      storageBlocked = true;
      return false;
    }

    memoryStore.set(key, value);
    return true;
  } catch (error) {
    storageBlocked = true;
    console.warn(`secureTabStorage: falha ao salvar "${key}".`, error);
    return false;
  }
};

const removeItem = (key: string): void => {
  try {
    memoryStore.delete(key);
    safeStorage.removeItem(key);
  } catch (error) {
    // Storage blocked - ignore silently
  }
};

export const secureTabStorage = {
  getItem,
  setItem,
  removeItem,
  isBlocked: () => storageBlocked,
};
