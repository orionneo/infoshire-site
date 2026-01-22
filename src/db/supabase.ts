import { createClient } from '@supabase/supabase-js';

/**
 * ✅ SUPABASE CLIENT (definitive stability patch)
 *
 * Root cause you are seeing:
 * - Supabase Auth uses an internal cross-tab lock.
 * - In some browsers/PWA situations (Edge/iOS/Tracking Prevention / race conditions),
 *   that lock acquisition can abort and bubble up as:
 *   "AbortError: signal is aborted without reason" (during _acquireLock / initialize).
 *
 * Fix:
 * - Provide our own in-memory lock implementation compatible with Supabase Auth.
 *   This removes the abort-based lock path completely, while keeping sessions persisted.
 */

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

// ✅ In-memory lock queue (FIFO) compatible with Supabase Auth lock signature:
// lock: (key, acquireTimeout, fn) => Promise<any>
let __lockQueue: Promise<any> = Promise.resolve();

const memoryLock = async (_key: string, _acquireTimeout: number, fn: () => Promise<any>) => {
  const run = __lockQueue.then(fn, fn);
  // always clear queue regardless of success/failure
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
    storage: localStorage,
    flowType: 'pkce',

    // ✅ THE FIX (prevents AbortError in _acquireLock/initialize)
    lock: memoryLock as any,
  },
});

// Helpful for debugging in prod (you used this in console already)
try {
  (window as any).supabase = supabase;
} catch {
  // ignore
}

/**
 * Ensure token is fresh before critical operations (create OS, etc.)
 * - If session is close to expiring, refresh it.
 */
export async function ensureFreshSession(minValiditySeconds: number = 60): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return false;
    const s = data.session;
    if (!s) return false;

    const expiresAt = (s.expires_at ?? 0) * 1000;
    const remainingMs = expiresAt - Date.now();

    if (remainingMs <= minValiditySeconds * 1000) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) return false;
      return !!refreshed.session;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Lightweight health check used by Admin "ping" style.
 * - Avoids table permission assumptions: checks session + a tiny profiles select.
 */
export async function pingSupabase(label: string = 'ping'): Promise<boolean> {
  try {
    const ok = await ensureFreshSession(30);
    if (!ok) return false;

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
