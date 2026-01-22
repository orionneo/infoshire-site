import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('❌ Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

/**
 * Keep Supabase simple and stable (like the original medo.dev project):
 * - Persist session in localStorage (default)
 * - Auto-refresh tokens (so PWA/tab switching keeps working)
 * - Detect OAuth session on callback URL
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Keep as implicit to avoid breaking your current working Google OAuth setup.
    flowType: 'implicit',
    storageKey: 'infoshire-auth',
  },
});

/**
 * Small "wake up" helper used by some parts of the app to make sure the session is hydrated
 * and the network path to Supabase is alive. Safe no-op when offline.
 */
export async function wakeSupabase(_reason: string = 'wake') {
  try {
    // hydrate session (no network if cached)
    await supabase.auth.getSession();
    // lightweight ping (network)
    await supabase.from('profiles').select('id').limit(1);
  } catch {
    // ignore — offline / transient
  }
}
