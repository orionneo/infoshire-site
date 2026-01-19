import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

function getCodeFromUrl(): string | null {
  // Caso 1: URL normal com query (?code=...)
  const searchParams = new URLSearchParams(window.location.search);
  const codeFromSearch = searchParams.get('code');
  if (codeFromSearch) return codeFromSearch;

  // Caso 2: HashRouter (#/auth/callback?code=...)
  const hash = window.location.hash || '';
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const hashParams = new URLSearchParams(queryString);
  return hashParams.get('code');
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const code = getCodeFromUrl();

        if (!code) {
          console.warn('AuthCallback: sem code na URL. href=', window.location.href);
          if (!cancelled) navigate('/login', { replace: true });
          return;
        }

        // Mais robusto que passar só "code" (funciona em mais cenários)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error('exchangeCodeForSession error:', error);
          if (!cancelled) navigate('/login', { replace: true });
          return;
        }

        // Sessão deve existir agora
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          console.warn('AuthCallback: exchange OK mas sem session.user. href=', window.location.href);
          if (!cancelled) navigate('/login', { replace: true });
          return;
        }

        if (!cancelled) navigate('/client', { replace: true });
      } catch (e) {
        console.error('AuthCallback error:', e);
        if (!cancelled) navigate('/login', { replace: true });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground">Finalizando login...</p>
      </div>
    </div>
  );
}
