import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Mantém o erro explícito (ajuda a debugar em produção)
  // eslint-disable-next-line no-console
  console.error('❌ Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

/**
 * ✅ Config simples e robusta (próxima do projeto original do medo.dev):
 * - persistSession + autoRefreshToken para PWA ficar estável ao trocar de aba / minimizar
 * - detectSessionInUrl para OAuth callback funcionar (Google)
 * - usa localStorage padrão (mais resiliente que sessionStorage em PWA)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * "Acorda" a sessão antes de chamadas sensíveis (ex: criar OS) e evita estados travados
 * quando o PWA volta do background.
 */
export async function wakeSupabase(_reason: string = 'wake'): Promise<import('@supabase/supabase-js').Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session ?? null;
  } catch {
    return null;
  }
}
