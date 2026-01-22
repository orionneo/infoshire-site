import { createClient } from '@supabase/supabase-js';

/**
 * ✅ SUPABASE CLIENT (simple & stable)
 * - Uses localStorage so auth survives tab change / PWA backgrounding.
 * - Keeps OAuth working (detectSessionInUrl: true).
 * - No custom refresh loops (those can cause random sign-outs).
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this as a hard fail to avoid silent auth issues.
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
  },
});

/**
 * Lightweight health check used by the Admin "ping" style.
 * It just validates we still have a session and that Supabase is reachable.
 */
export async function pingSupabase(label: string = 'ping'): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;
    // cheap request (doesn't need RLS permissions on your tables)
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.warn(`⚠️ pingSupabase(${label}) failed:`, error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`⚠️ pingSupabase(${label}) exception:`, e);
    return false;
  }
}
