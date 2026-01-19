import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,

    // ✅ Quem processa o "code" é o AuthCallback (exchangeCodeForSession),
    // então NÃO deixe o supabase tentar ler URL sozinho.
    detectSessionInUrl: false,

    // ✅ Garante compatibilidade e evita “locks” estranhos em alguns browsers
    storage: window.localStorage,
  },
});
