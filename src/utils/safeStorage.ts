const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch (error) {
    console.warn('safeStorage: sessão indisponível, usando apenas memória.', error);
    return null;
  }
};

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn('safeStorage: local indisponível, usando apenas memória.', error);
    return null;
  }
};

const getItem = (key: string): string | null => {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn(`safeStorage: falha ao ler "${key}".`, error);
    return null;
  }
};

const setItem = (key: string, value: string): boolean => {
  const storage = getSessionStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`safeStorage: falha ao salvar "${key}".`, error);
    return false;
  }
};

const removeItem = (key: string): boolean => {
  const storage = getSessionStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`safeStorage: falha ao remover "${key}".`, error);
    return false;
  }
};

export const safeStorage = {
  getItem,
  setItem,
  removeItem,
};

export const safeLocalStorage = {
  getItem: (key: string) => {
    const storage = getLocalStorage();
    if (!storage) {
      return null;
    }

    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn(`safeStorage: falha ao ler "${key}" no localStorage.`, error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    const storage = getLocalStorage();
    if (!storage) {
      return false;
    }

    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`safeStorage: falha ao salvar "${key}" no localStorage.`, error);
      return false;
    }
  },
  removeItem: (key: string) => {
    const storage = getLocalStorage();
    if (!storage) {
      return false;
    }

    try {
      storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`safeStorage: falha ao remover "${key}" no localStorage.`, error);
      return false;
    }
  },
};
