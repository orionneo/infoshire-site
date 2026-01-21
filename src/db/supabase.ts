import { createClient } from '@supabase/supabase-js';

// ================================
// 🔒 Memory Lock com timeout SAFE
// Evita travamento eterno (Safari / PWA / background)
// ================================

let __lockQueue: Promise<any> = Promise.resolve();

/**
 * Lock em memória compatível com Supabase LockFunc
 * NUNCA deixa a fila travar indefinidamente
 */
export const memoryLock = async (
  _key: string,
  acquireTimeout: number,
  fn: () => Promise<any>
) => {
  const timeoutMs = Math.max(5000, Number(acquireTimeout || 15000));

  const runFnWithTimeout = () =>
    Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`memoryLock timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);

  const run = __lockQueue.then(runFnWithTimeout, runFnWithTimeout);

  // ✅ LIBERA A FILA SEMPRE (SUCESSO, ERRO OU TIMEOUT)
  __lockQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ✅ Melhor quebrar cedo do que virar "loading eterno"
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
    // fallback: memory (não persiste em refresh)
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

// =======================================
// ✅ fetch com timeout (evita spinner infinito no PWA)
// =======================================
const DEFAULT_FETCH_TIMEOUT_MS = 30000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Se alguém já passou um signal, “encadeia” abortos
  const upstream = init?.signal;
  if (upstream) {
    if (upstream.aborted) controller.abort();
    upstream.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return fetch(input, {
    ...(init || {}),
    cache: 'no-store',
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ OAuth Google + GitHub Pages + HashRouter (#)
    // Mantém implicit + detectSessionInUrl, pois o callback pode cair com hash.
    flowType: 'implicit',
    detectSessionInUrl: true,

    // 🔥 PWA FIX:
    // - NÃO tenta refresh no background (evita travar quando minimiza)
    // - Refresh será controlado por eventos (abaixo)
    autoRefreshToken: false,

    persistSession: true,

    // 🔥 “fechou o PWA/aba -> reloga”
    storage: typeof window !== 'undefined' ? getSessionStorageOrMemory() : undefined,
    storageKey: 'infoshire-auth',

    // ✅ Evita Navigator Locks bug / AbortError
    lock: memoryLock,
  },

  // ✅ Evita cache estranho (SW / proxies) em requests do Supabase
  global: {
    fetch: (url, options) => fetchWithTimeout(url, options as any),
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

// ✅ Mantém sessão viva enquanto app está ABERTO e VISÍVEL (especialmente admin).
let refreshTimer: number | null = null;

function startVisibleRefreshLoop() {
  if (refreshTimer) return;
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void safeRefreshIfNeeded();
    }
  }, 60000);
}

function stopVisibleRefreshLoop() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function setupRefreshListeners() {
  // Quando volta pro app/aba, garante refresh
  window.addEventListener('focus', () => {
    void safeRefreshIfNeeded();
  });

  // No PWA, visibilitychange é essencial (minimizou/voltou)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void safeRefreshIfNeeded();
    }
  });

  if (document.visibilityState === 'visible') startVisibleRefreshLoop();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startVisibleRefreshLoop();
    else stopVisibleRefreshLoop();
  });
}

// ✅ HMR/DEV GUARD: evita duplicar listeners/intervalos no Vite dev
declare global {
  interface Window {
    __INFOSHIRE_SUPABASE_REFRESH_BOUND__?: boolean;
  }
}

// ✅ Só registra listeners no browser (e só 1x mesmo com HMR)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (!window.__INFOSHIRE_SUPABASE_REFRESH_BOUND__) {
    window.__INFOSHIRE_SUPABASE_REFRESH_BOUND__ = true;
    setupRefreshListeners();
  }
}
