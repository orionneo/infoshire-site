import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🔴 DEBUG VISÍVEL NO CONSOLE
console.log('🔍 SUPABASE ENV CHECK', {
  supabaseUrl,
  anonKeyLength: supabaseAnonKey?.length,
  baseUrl: import.meta.env.BASE_URL,
  origin: window.location.origin,
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase ENV vars missing in build');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
