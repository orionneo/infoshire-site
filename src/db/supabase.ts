import { createClient } from '@supabase/supabase-js';

// ================================
// 🔒 Memory Lock "NO-THROW" (SAFE)
// - Nunca rejeita por timeout de acquire
// - Se detectar deadlock, reseta a fila e segue
// - Sempre libera a fila
// ================================

let __lockQueue: Promise<void> = Promise.resolve();

export const memoryLock = async <T>(
  _key: string,
  acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  const timeoutMs = Math.max(5000, Number(acquireTimeout || 15000));

  // 1) Espera sua vez na fila, mas NÃO joga erro.
  // Se travar, reseta a fila e continua.
  let timedOut = false;
  await Promise.race([
    __lockQueue,
    new Promise<void>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve();
      }, timeoutMs);
    }),
  ]);

  if (timedOut) {
    console.warn(`⚠️ memoryLock acquire timed out after ${timeoutMs}ms — resetting lock queue`);
    __lockQueue = Promise.resolve();
  }

  // 2) Executa o trabalho.
  const run = (async () => {
    return await fn();
  })();

  // 3) Garante liberação da fila SEMPRE.
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
// ✅ fetch com timeout (evita spinner infinito no PWA/iOS)
// =======================================
const DEFAULT_FETCH_TIMEOUT_MS = 25000;

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
  })
    .catch((err) => {
      // ✅ Log útil para entender travas no iOS
      const name = (err && (err.name as string)) || '';
      if (name === 'AbortError') {
        console.warn('⏱️ Supabase fetch aborted by timeout', { input });
      } else {
        console.warn('🌐 Supabase fetch error', { input, err });
      }
      throw err;
    })
    .finally(() => clearTimeout(timer));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ OAuth Google + GitHub Pages + HashRouter (#)
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

let __refreshRunning = false;
let __lastWakeAt = 0;

// Evita spam ao alternar apps (WhatsApp <-> PWA)
const WAKE_THROTTLE_MS = 6000;

async function safeRefreshIfNeeded(reason: string) {
  if (__refreshRunning) return;

  const now = Date.now();
  if (now - __lastWakeAt < WAKE_THROTTLE_MS) return;
  __lastWakeAt = now;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  __refreshRunning = true;
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) return;

    const expiresAtMs = (session.expires_at || 0) * 1000;
    const now2 = Date.now();

    // Se expirou ou expira em breve, força refresh
    const willExpireSoon = expiresAtMs > 0 && expiresAtMs - now2 < 2 * 60 * 1000; // 2 min
    const alreadyExpired = expiresAtMs > 0 && expiresAtMs <= now2;

    if (alreadyExpired || willExpireSoon) {
      console.info(`🔐 supabase refreshSession (${reason})`);
      await supabase.auth.refreshSession();
    }
  } catch (e) {
    // Não derruba UI
    console.warn(`⚠️ safeRefreshIfNeeded falhou (${reason}) (sem derrubar UI):`, e);
  } finally {
    __refreshRunning = false;
  }
}

/**
 * ✅ Exportado para o Step 3 (auto-sync)
 * Use quando o app voltar do background:
 * - “acorda” sessão
 * - tenta refresh se precisar
 */
export async function wakeSupabase(reason: string = 'wake') {
  await safeRefreshIfNeeded(reason);
}

// ✅ Mantém sessão viva enquanto app está ABERTO e VISÍVEL (especialmente admin).
let refreshTimer: number | null = null;

function startVisibleRefreshLoop() {
  if (refreshTimer) return;
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void safeRefreshIfNeeded('visible-loop');
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
    void safeRefreshIfNeeded('focus');
  });

  // No PWA, visibilitychange é essencial (minimizou/voltou)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void safeRefreshIfNeeded('visibility->visible');
    }
  });

  // Safari/iOS: volta do WhatsApp às vezes vem via bfcache
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    const persisted = (e as any).persisted ? 'bfcache' : 'normal';
    void safeRefreshIfNeeded(`pageshow:${persisted}`);
  });

  // Quando a rede volta (muito comum depois de alternar apps)
  window.addEventListener('online', () => {
    void safeRefreshIfNeeded('online');
  });

  if (document.visibilityState === 'visible') startVisibleRefreshLoop();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startVisibleRefreshLoop();
    else stopVisibleRefreshLoop();
  });

  // Primeira tentativa após carregar
  void safeRefreshIfNeeded('startup');
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
