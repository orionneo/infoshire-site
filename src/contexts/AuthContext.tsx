import type { User } from '@supabase/supabase-js';
import React, { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';

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
 * - id do profile = auth.user.id (chave única e sem conflito)
 * - cria/atualiza name/email do metadata
 * - NÃO sobrescreve phone se já existe no banco
 * - NÃO sobrescreve role se já existe no banco
 */
async function ensureProfile(user: User): Promise<Profile | null> {
  try {
    const meta = (user.user_metadata || {}) as Record<string, any>;

    const nameFromMeta: string | null =
      meta.full_name || meta.name || meta.given_name || meta.preferred_username || null;

    // 1) Tenta ler
    const existing = await getProfile(user.id);

    // 2) Se não existir, cria
    if (!existing) {
      const payload: Partial<Profile> = {
        id: user.id,
        email: user.email ?? null,
        name: nameFromMeta ?? null,
        phone: null, // será preenchido no CompleteProfile
        role: 'client' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

    // 3) Se existe, atualiza somente campos “seguros” (não pisa no telefone nem role)
    const shouldUpdateName = (!existing.name || existing.name.trim() === '') && !!nameFromMeta;
    const shouldUpdateEmail = (!existing.email || existing.email.trim() === '') && !!user.email;

    if (shouldUpdateName || shouldUpdateEmail) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...(shouldUpdateName ? { name: nameFromMeta } : {}),
          ...(shouldUpdateEmail ? { email: user.email } : {}),
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
  signUpWithEmail: (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await getProfile(user.id);
    setProfile(p);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
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

      setLoading(false);
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
      // ✅ GH Pages: redirect SEM hash (callback real)
      const redirectTo = `${window.location.origin}/infoshire-site/auth/callback`;

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