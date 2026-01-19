import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Ajuda MUITO a diagnosticar build no GitHub Pages (env faltando)
  console.error('[SUPABASE] Variáveis de ambiente faltando:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey,
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    // ✅ IMPORTANTE: DESLIGA o processamento automático do code
    // pois você vai processar manualmente no /auth/callback
    detectSessionInUrl: false,
  },
});
