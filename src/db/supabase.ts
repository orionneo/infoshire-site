import { createClient } from '@supabase/supabase-js';

// ✅ Lock em memória (fila) compatível com LockFunc: (key, acquireTimeout, fn)
let __lockQueue: Promise<any> = Promise.resolve();

const memoryLock = async (
  _key: string,
  _acquireTimeout: number,
  fn: () => Promise<any>
) => {
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
  console.error(
    '❌ Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ GitHub Pages + HashRouter: use implicit flow (mais estável que pkce nesse cenário)
    flowType: 'implicit',

    autoRefreshToken: true,
    persistSession: true,

    // ✅ Deixa o Supabase processar o retorno OAuth automaticamente
    detectSessionInUrl: true,

    storage: window.localStorage,

    // ✅ Evita Navigator Locks bug / AbortError
    lock: memoryLock,
  },
});
