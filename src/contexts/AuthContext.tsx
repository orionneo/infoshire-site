import type { User } from '@supabase/supabase-js';
import React, { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, ensureFreshSession } from '@/db/supabase';
import type { Profile } from '@/types/types';

function isAbortError(e: any) {
  return e?.name === 'AbortError' || String(e?.message || '').toLowerCase().includes('aborted');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retryOnceOnAbort<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (isAbortError(e)) {
      await sleep(150);
      return await fn();
    }
    throw e;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return await retryOnceOnAbort(async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      console.error('Falha ao buscar profile:', error);
      return null;
    }
    return data as Profile | null;
  });
}

async function ensureProfile(user: User): Promise<Profile | null> {
  try {
    const meta = (user.user_metadata || {}) as Record<string, any>;

    const nameFromMeta: string | null =
      meta.full_name || meta.name || meta.given_name || meta.preferred_username || null;

    const phoneFromMetaRaw: string | null = meta.phone || null;
    const phoneFromMeta = phoneFromMetaRaw ? String(phoneFromMetaRaw).trim() : null;

    const existing = await getProfile(user.id);

    if (!existing) {
      const payload: Partial<Profile> = {
        id: user.id,
        email: user.email ?? null,
        name: nameFromMeta ?? null,
        phone: phoneFromMeta ?? null,
        role: ('client' as any),
      };

      const { data, error } = await retryOnceOnAbort(async () =>
        await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select('*').single()
      );
      if (error) {
        console.error('Falha ao criar profile:', error);
        return null;
      }
      return data as Profile;
    }

    const shouldUpdateName = (!existing.name || existing.name.trim() === '') && !!nameFromMeta;
    const shouldUpdateEmail = (!existing.email || existing.email.trim() === '') && !!user.email;
    const shouldUpdatePhone = (!existing.phone || String(existing.phone).trim() === '') && !!phoneFromMeta;

    if (shouldUpdateName || shouldUpdateEmail || shouldUpdatePhone) {
      const { data, error } = await retryOnceOnAbort(async () =>
        await supabase
          .from('profiles')
          .update({
            ...(shouldUpdateName ? { name: nameFromMeta } : {}),
            ...(shouldUpdateEmail ? { email: user.email } : {}),
            ...(shouldUpdatePhone ? { phone: phoneFromMeta } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select('*')
          .single()
      );

      if (error) {
        console.error('Falha ao atualizar profile (metadata):', error);
        return existing;
      }
      return data as Profile;
    }

    return existing;
  } catch (e) {
    console.error('ensureProfile error:', e);
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (data: { name: string; phone: string; email?: string; password: string }) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function needsPhone(p: Profile | null) {
  const phone = (p?.phone ?? '').toString().trim();
  return phone.length === 0;
}

const PHONE_EXEMPT_ROUTES = [
  '/login',
  '/register',
  '/auth/callback',
  '/complete-profile',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/admin',         // ✅ Admins don't need phone verification
  '/admin/orders',
  '/admin/clients',
  '/admin/dashboard',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ evita concorrência (múltiplos ensureProfile ao mesmo tempo)
  const ensureProfileInFlight = useRef<Promise<Profile | null> | null>(null);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await getProfile(user.id);
    setProfile(p);
  };

  // ✅ Forçar telefone (se user + profile já carregaram)
  // 🚫 CRÍTICO: Nunca redirecionar admin - apenas clients que faltam phone
  useEffect(() => {
    if (!loading && user && profile) {
      const path = location.pathname;
      const isAdmin = profile.role === 'admin';
      const isAdminPath = path.startsWith('/admin');
      const isExempt = PHONE_EXEMPT_ROUTES.includes(path);

      // 🚫 NUNCA redirecionar admin, mesmo sem phone
      if (!isExempt && !isAdmin && !isAdminPath && needsPhone(profile)) {
        navigate('/complete-profile', { replace: true });
      }
    }
  }, [loading, user, profile, location.pathname, navigate]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await ensureFreshSession(60);

        const { data } = await retryOnceOnAbort(async () => await supabase.auth.getSession());
        const sessionUser = data.session?.user ?? null;

        if (!mounted) return;

        setUser(sessionUser);

        if (sessionUser) {
          // serializa ensureProfile
          ensureProfileInFlight.current ??= ensureProfile(sessionUser);
          const p = await ensureProfileInFlight.current;
          ensureProfileInFlight.current = null;

          if (!mounted) return;
          setProfile(p);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error('AuthProvider init error:', e);
        if (!mounted) return;
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      try {
        if (sessionUser) {
          await ensureFreshSession(60);
          ensureProfileInFlight.current ??= ensureProfile(sessionUser);
          const p = await ensureProfileInFlight.current;
          ensureProfileInFlight.current = null;
          setProfile(p);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error('onAuthStateChange error:', e);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const isEmail = username.includes('@');
      const email = isEmail ? username : `${username}@miaoda.com`;

      const { error } = await retryOnceOnAbort(async () => await supabase.auth.signInWithPassword({ email, password }));
      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const email = `${username}@miaoda.com`;
      const { error } = await retryOnceOnAbort(async () => await supabase.auth.signUp({ email, password }));
      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (data: { name: string; phone: string; email?: string; password: string }) => {
    try {
      const email = data.email || `${data.phone.replace(/\D/g, '')}@temp.infoshire.com`;

      const { error } = await retryOnceOnAbort(async () =>
        await supabase.auth.signUp({
          email,
          password: data.password,
          options: { data: { name: data.name, phone: data.phone } },
        })
      );

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const redirectTo = `${window.location.origin}${base}`;

      const { error } = await retryOnceOnAbort(async () =>
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: { access_type: 'offline', prompt: 'consent' },
          },
        })
      );

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithUsername,
      signUpWithUsername,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
