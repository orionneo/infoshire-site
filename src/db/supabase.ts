import { createClient } from '@supabase/supabase-js';

/**
 * ✅ SUPABASE CLIENT (stable + resilient)
 *
 * Fixes the recurring "AbortError: signal is aborted without reason" that can happen in PWAs
 * when some code reuses / aborts an AbortController signal.
 *
 * Strategy:
 * - Use localStorage so auth survives tab change / PWA backgrounding.
 * - Keep autoRefreshToken enabled.
 * - Provide a resilient fetch that *drops an aborted signal* and retries once without it.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Hard fail to avoid silent auth issues.
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // If some upstream code passes an already-aborted signal, drop it to prevent instant AbortError.
  const sanitizeInit = (i?: RequestInit): RequestInit | undefined => {
    if (!i) return i;
    const anyInit: any = i as any;
    const sig: AbortSignal | undefined = anyInit.signal;
    if (sig && sig.aborted) {
      const { signal, ...rest } = anyInit;
      return rest;
    }
    return i;
  };

  try {
    return await fetch(input, sanitizeInit(init));
  } catch (e: any) {
    // One retry without signal for "AbortError" (common in PWA background/foreground + reused controller)
    const isAbort =
      e?.name === 'AbortError' ||
      String(e?.message || '').includes('signal is aborted') ||
      String(e?.message || '').includes('AbortError');

    if (!isAbort) throw e;

    const anyInit: any = init as any;
    const { signal, ...rest } = anyInit || {};
    return await fetch(input, rest);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: resilientFetch,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
  },
});

// Small debug helper (optional): allows you to type in DevTools `window.supabase?.auth.getSession()`
try {
  (window as any).supabase = supabase;
} catch {
  // ignore if window is not available
}

/**
 * Ensures we have a valid session and refreshes proactively when close to expiry.
 * This prevents "random 401/RLS" after tab switching / PWA backgrounding.
 */
export async function ensureFreshSession(minValiditySeconds: number = 60): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const session = data.session;
  if (!session) throw new Error('Sessão expirada. Faça login novamente.');

  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = expiresAt - now;

  if (secondsLeft <= minValiditySeconds) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
  }
}

/**
 * Lightweight health check used by the Admin "ping" style.
 */
export async function pingSupabase(label: string = 'ping'): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;

    // Cheap request (RLS-friendly). If you have strict RLS on profiles, switch to `auth.getUser()` only.
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
