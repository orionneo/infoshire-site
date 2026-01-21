import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client focado em estabilidade no PWA:
 * - mantém sessão enquanto o PWA está aberto (sessionStorage)
 * - refresh automático de token ligado
 * - NÃO aborta fetch (AbortController em PWA costuma causar comportamentos estranhos)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
  throw new Error('supabaseKey is required.');
}

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // ✅ mantém logado enquanto o PWA está aberto (se fechar/kilar, pede login de novo — esperado)
    storage: sessionStorage,
  },
  global: {
    // ⚠️ Não abortar fetch em PWA (evita travas/pending promises)
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  },
  // @ts-ignore (runtime aceita lock)
  lock: memoryLock,
});

/**
 * Extra robustez: quando o app volta do background, às vezes o token expira.
 * Rodamos um refresh só quando volta ao foco/visível.
 */
let __refreshRunning = false;

async function refreshSessionOnWake(reason: string) {
  if (__refreshRunning) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  __refreshRunning = true;
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) return;

    const expiresAtMs = (session.expires_at || 0) * 1000;
    const now = Date.now();

    // Se expira em até 2 minutos, força refresh
    const willExpireSoon = expiresAtMs > 0 && expiresAtMs - now < 2 * 60 * 1000;
    if (willExpireSoon) {
      console.log('🔁 Auth refresh on wake:', reason);
      await supabase.auth.refreshSession();
    }
  } catch (e) {
    console.warn('⚠️ refreshSessionOnWake falhou:', e);
  } finally {
    __refreshRunning = false;
  }
}


// --- wakeSupabase: exportado para “acordar” auth + conexão após background/tab switch ---
export async function wakeSupabase(reason: string = 'manual') {
  // evita rodar quando offline
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  try {
    // 1) Garante que existe sessão local e tenta refresh se estiver perto de expirar
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (session?.expires_at) {
      const expiresAtMs = session.expires_at * 1000;
      const now = Date.now();
      const willExpireSoon = expiresAtMs - now < 3 * 60 * 1000; // 3 min
      if (willExpireSoon) {
        console.log('🔁 wakeSupabase refreshSession:', reason);
        await supabase.auth.refreshSession();
      }
    }

    // 2) “Ping” leve no PostgREST (qualquer tabela que o admin consiga ler)
    // Isso costuma “destravar” requests pendentes após voltar do background.
    // Se preferir outra tabela mais segura, troque aqui.
    await supabase.from('profiles').select('id').limit(1);
  } catch (e) {
    console.warn('⚠️ wakeSupabase falhou:', e);
  }
}



if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => void refreshSessionOnWake('focus'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshSessionOnWake('visible');
  });
  window.addEventListener('online', () => void refreshSessionOnWake('online'));
}
