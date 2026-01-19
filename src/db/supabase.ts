import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,

    // ✅ MUITO IMPORTANTE com HashRouter + GH Pages:
    // não deixa o supabase tentar ler code da URL sozinho
    detectSessionInUrl: false,

    // ✅ evita conflito/lock com outras builds/projetos
    storageKey: 'infoshire-auth',
  },
});
