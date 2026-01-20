import { createClient } from '@supabase/supabase-js';

// ✅ Lock em memória (fila) compatível com LockFunc: (key, acquireTimeout, fn)
let __lockQueue: Promise<any> = Promise.resolve();

const memoryLock = async (_key: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  const run = __lockQueue.then(fn, fn);
  __lockQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

// ✅ Storage “de sessão”: mantém enquanto app/aba existe; ao fechar, some (exige login)
function getSessionStorageOrMemory(): Storage {
  try {
    const s = window.sessionStorage;
    const k = '__ss_test__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    // fallback: memory (ainda mais “seguro” porque não persiste em refresh)
    const mem = new Map<string, string>();
    return {
      get length() {
        return mem.size;
      },
      clear() {
        mem.clear();
      },
      getItem(key: string) {
        return mem.has(key) ? mem.get(key)! : null;
      },
      key(index: number) {
        return Array.from(mem.keys())[index] ?? null;
      },
      removeItem(key: string) {
        mem.delete(key);
      },
      setItem(key: string, value: string) {
        mem.set(key, value);
      },
    } as Storage;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ GitHub Pages + HashRouter: ok
    flowType: 'implicit',

    // 🔥 PWA FIX:
    // - NÃO tenta refresh no background (evita travar quando minimiza)
    // - Refresh será controlado por eventos (abaixo)
    autoRefreshToken: false,

    persistSession: true,
    detectSessionInUrl: true,

    // 🔥 “fechou o PWA/aba -> reloga”
    storage: getSessionStorageOrMemory(),
    storageKey: 'infoshire-auth',

    // ✅ Evita Navigator Locks bug / AbortError
    lock: memoryLock,
  },

  // ✅ Evita cache estranho (SW / proxies) em requests do Supabase
  global: {
    fetch: (url, options) => fetch(url, { ...(options || {}), cache: 'no-store' }),
  },
});

// =======================================
// ✅ Refresh controlado (PWA / mobile safe)
// =======================================

async function safeRefreshIfNeeded() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) return;

    // Se expira em breve, força refresh
    const expiresAtMs = (session.expires_at || 0) * 1000;
    const now = Date.now();
    const willExpireSoon = expiresAtMs > 0 && expiresAtMs - now < 2 * 60 * 1000; // 2 min

    if (willExpireSoon) {
      await supabase.auth.refreshSession();
    }
  } catch (e) {
    // Não derruba UI
    console.warn('⚠️ safeRefreshIfNeeded falhou (sem derrubar UI):', e);
  }
}

// Quando volta pro app/aba, garante refresh sem “timeout”
window.addEventListener('focus', () => {
  void safeRefreshIfNeeded();
});

// No PWA, visibilitychange é essencial (minimizou/voltou)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    void safeRefreshIfNeeded();
  }
});
