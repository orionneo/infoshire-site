import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// 🔒 Lock "no-op" para evitar AbortError no acquireLock em alguns browsers/ambientes
const noLock = {
  acquire: async (_key: string, fn: () => Promise<any>) => {
    return await fn();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,

    // ✅ IMPORTANTÍSSIMO:
    // Como usamos OAuthBridge + AuthCallback com exchangeCodeForSession,
    // NÃO deixe o supabase tentar processar URL sozinho (evita conflitos/loops).
    detectSessionInUrl: false,

    // ✅ Evita AbortError do lock interno
    lock: noLock as any,
  },
});
