import type { User } from '@supabase/supabase-js';
import React, { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';

/** Lê o profile */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    console.error('Falha ao buscar profile:', error);
    return null;
  }
  return (data as Profile) ?? null;
}

/**
 * Garante que exista um profile para o user autenticado.
 * - id do profile = auth.user.id
 * - cria/atualiza name/email do metadata
 * - salva phone se vier do metadata (cadastro normal)
 * - NÃO sobrescreve phone se já existe no banco
 */
async function ensureProfile(user: User): Promise<Profile | null> {
  try {
    const meta = (user.user_metadata || {}) as Record<string, any>;

    const nameFromMeta: string | null =
      meta.full_name || meta.name || meta.given_name || meta.preferred_username || null;

    const phoneFromMetaRaw: string | null = meta.phone || null;
    const phoneFromMeta = phoneFromMetaRaw ? String(phoneFromMetaRaw).trim() : null;

    const existing = await getProfile(user.id);

    // Se não existir, cria
    if (!existing) {
      const payload: Partial<Profile> = {
        id: user.id,
        email: user.email ?? null,
        name: nameFromMeta ?? null,
        phone: phoneFromMeta ?? null,
        role: 'client' as any,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) {
        console.error('Falha ao criar profile:', error);
        return null;
      }
      return data as Profile;
    }

    // Se existe, atualiza somente campos “seguros”
    const shouldUpdateName = (!existing.name || existing.name.trim() === '') && !!nameFromMeta;
    const shouldUpdateEmail = (!existing.email || existing.email.trim() === '') && !!user.email;
    const shouldUpdatePhone = (!existing.phone || String(existing.phone).trim() === '') && !!phoneFromMeta;

    if (shouldUpdateName || shouldUpdateEmail || shouldUpdatePhone) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...(shouldUpdateName ? { name: nameFromMeta } : {}),
          ...(shouldUpdateEmail ? { email: user.email } : {}),
          ...(shouldUpdatePhone ? { phone: phoneFromMeta } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single();

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

function profileNeedsPhone(p: Profile | null) {
  const phone = (p?.phone ?? '').toString().trim();
  return phone.length === 0;
}

// Rotas onde NÃO devemos forçar redirect pro complete-profile
const PHONE_EXEMPT_ROUTES = [
  '/login',
  '/register',
  '/auth/callback',
  '/complete-profile',
  '/forgot-password',
  '/reset-password',
  '/change-password',
];

/** Pega o code do OAuth tanto do search quanto do hash */
function getOAuthCodeFromUrl(): string | null {
  // Ex: /infoshire-site/?code=XXX#/login
  const sp = new URLSearchParams(window.location.search);
  const codeFromSearch = sp.get('code');
  if (codeFromSearch) return codeFromSearch;

  // Ex: /infoshire-site/#/auth/callback?code=XXX
  const hash = window.location.hash || '';
  const qs = hash.includes('?') ? hash.split('?')[1] : '';
  const hp = new URLSearchParams(qs);
  const codeFromHash = hp.get('code');
  if (codeFromHash) return codeFromHash;

  return null;
}

/** Remove o ?code= da URL pra evitar loop */
function cleanOAuthCodeFromUrl() {
  try {
    // Mantém o hash atual
    const hash = window.location.hash || '#/';
    const clean = `${window.location.origin}${window.location.pathname}${hash}`;
    window.history.replaceState({}, '', clean);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await getProfile(user.id);
    setProfile(p);
  };

  /**
   * ✅ FORÇA TELEFONE:
   * Depois de logado e com profile carregado, se não for admin e não tiver phone, manda pro complete-profile,
   * exceto em rotas liberadas.
   */
  useEffect(() => {
    if (!loading && user && profile) {
      const path = location.pathname;
      const isExempt = PHONE_EXEMPT_ROUTES.includes(path);

      if (!isExempt && profile.role !== 'admin' && profileNeedsPhone(profile)) {
        navigate('/complete-profile', { replace: true });
      }
    }
  }, [loading, user, profile, location.pathname, navigate]);

  /**
   * ✅ INIT:
   * Se voltar do Google com ?code=..., processa aqui ANTES de qualquer redirect.
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // 1) Se tem code na URL, troca por sessão agora (evita loop/tela preta)
        const code = getOAuthCodeFromUrl();
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error('exchangeCodeForSession (init) error:', error);
          cleanOAuthCodeFromUrl();
        }

        // 2) Agora pega sessão normal
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user ?? null;

        if (!mounted) return;

        setUser(sessionUser);

        if (sessionUser) {
          const p = await ensureProfile(sessionUser);
          if (!mounted) return;
          setProfile(p);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error('AuthProvider init error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const p = await ensureProfile(sessionUser);
        setProfile(p);
      } else {
        setProfile(null);
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

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const email = `${username}@miaoda.com`;
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (data: { name: string; phone: string; email?: string; password: string }) => {
    try {
      const email = data.email || `${data.phone.replace(/\D/g, '')}@temp.infoshire.com`;

      const { error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: { data: { name: data.name, phone: data.phone } },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const isGithubPages = window.location.hostname.endsWith('github.io');
      const basePath = isGithubPages ? '/infoshire-site' : '';

      // Mesmo que o Supabase ignore e volte com ?code=...#/login,
      // nosso INIT vai capturar e trocar a sessão.
      const redirectTo = `${window.location.origin}${basePath}/#/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

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