import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

/**
 * ✅ SUPABASE CLIENT (definitive stability patch)
 *
 * Root cause you are seeing:
 * - Supabase Auth uses an internal cross-tab lock.
 * - In some browsers/PWA situations (Edge/iOS/Tracking Prevention / race conditions),
 *   that lock acquisition can abort and bubble up as:
 *   "AbortError: signal is aborted without reason" (during _acquireLock / initialize).
 *
 * Fix:
 * - Provide our own in-memory lock implementation compatible with Supabase Auth.
 *   This removes the abort-based lock path completely, while keeping sessions persisted.
 */

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

// ✅ In-memory lock queue (FIFO) compatible with Supabase Auth lock signature:
// lock: (key, acquireTimeout, fn) => Promise<any>
let __lockQueue: Promise<any> = Promise.resolve();

const memoryLock = async (_key: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  const run = __lockQueue.then(fn, fn);
  // always clear queue regardless of success/failure
  __lockQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
})();

const STORAGE_CHOICE_KEY = '__supabase_storage_choice__';
let hasWarnedMemoryFallback = false;

const warnMemoryFallback = (error?: unknown) => {
  if (hasWarnedMemoryFallback) return;
  hasWarnedMemoryFallback = true;

  console.warn(
    '⚠️ Supabase auth storage unavailable. Falling back to in-memory storage (sessions will not persist across reloads).',
    error
  );

  if (typeof window === 'undefined') return;

  const isAdminRoute = window.location?.pathname?.includes('admin');
  if (!isAdminRoute) return;

  try {
    toast({
      title: 'Sessão do admin pode não persistir',
      description:
        'O navegador bloqueou o armazenamento local. A sessão será mantida apenas em memória até recarregar a página.',
      variant: 'destructive',
    });
  } catch (toastError) {
    console.warn('⚠️ Falha ao exibir aviso visual de storage em memória.', toastError);
  }
};

const canUseStorage = (storage: Storage) => {
  try {
    const testKey = '__supabase_storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const resolveSupabaseStorage = () => {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }

  const sessionAvailable = canUseStorage(window.sessionStorage);
  const localAvailable = canUseStorage(window.localStorage);

  let storedChoice: string | null = null;
  if (sessionAvailable) {
    try {
      storedChoice = window.sessionStorage.getItem(STORAGE_CHOICE_KEY);
    } catch (error) {
      console.warn('⚠️ Falha ao ler escolha de storage do sessionStorage.', error);
    }
  }

  if (storedChoice === 'session' && sessionAvailable) {
    return window.sessionStorage;
  }

  if (storedChoice === 'local' && localAvailable) {
    return window.localStorage;
  }

  if (localAvailable) {
    if (sessionAvailable) {
      try {
        window.sessionStorage.setItem(STORAGE_CHOICE_KEY, 'local');
      } catch (error) {
        console.warn('⚠️ Falha ao salvar escolha de storage local no sessionStorage.', error);
      }
    }
    return window.localStorage;
  }

  if (sessionAvailable) {
    try {
      window.sessionStorage.setItem(STORAGE_CHOICE_KEY, 'session');
    } catch (error) {
      console.warn('⚠️ Falha ao salvar escolha de storage sessão no sessionStorage.', error);
    }
    return window.sessionStorage;
  }

  warnMemoryFallback();
  return memoryStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: resolveSupabaseStorage(),
    flowType: 'pkce',

    // ✅ THE FIX (prevents AbortError in _acquireLock/initialize)
    lock: memoryLock as any,
  },
});

// Helpful for debugging in prod (you used this in console already)
try {
  (window as any).supabase = supabase;
} catch {
  // ignore
}

/**
 * Ensure token is fresh before critical operations (create OS, etc.)
 * - If session is close to expiring, refresh it.
 */
export async function ensureFreshSession(minValiditySeconds: number = 60): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return false;
    const s = data.session;
    if (!s) return false;

    const expiresAt = (s.expires_at ?? 0) * 1000;
    const remainingMs = expiresAt - Date.now();

    if (remainingMs <= minValiditySeconds * 1000) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) return false;
      return !!refreshed.session;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Lightweight health check used by Admin "ping" style.
 * - Avoids table permission assumptions: checks session + a tiny profiles select.
 */
export async function pingSupabase(label: string = 'ping'): Promise<boolean> {
  try {
    const ok = await ensureFreshSession(30);
    if (!ok) return false;

    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.warn(`⚠️ pingSupabase(${label}) failed:`, error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`⚠️ pingSupabase(${label}) exception:`, e);
    return false;
  }
}
