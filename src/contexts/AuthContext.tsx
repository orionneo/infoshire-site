import type { User } from '@supabase/supabase-js';
import React, { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('getProfile failed:', error);
    return null;
  }
  return data;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // evita “double bootstrap” em React StrictMode
  const bootstrapped = useRef(false);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // 1) Se voltou do OAuth via hash (#access_token=...), o supabase-js captura no getSession().
    // 2) Se voltou via PKCE (?code=...), precisamos trocar por sessão.
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    const finalize = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          getProfile(session.user.id).then((p) => {
            setProfile(p);
            setLoading(false);
          });
        } else {
          setProfile(null);
          setLoading(false);
        }
      });
    };

    if (code) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
        if (error) console.error('exchangeCodeForSession error:', error);

        // limpa o ?code=... (evita loop)
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url.toString());

        finalize();
      });
    } else {
      finalize();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const isEmail = username.includes('@');
      const email = isEmail ? username : `${username}@miaoda.com`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const email = `${username}@miaoda.com`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

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
        options: {
          data: {
            name: data.name,
            phone: data.phone,
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // ✅ sempre volta para uma rota existente no seu app
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithUsername,
        signUpWithUsername,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}