import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // HashRouter: /#/auth/callback?code=XXXX
        // O Supabase precisa de uma URL "completa" contendo ?code=
        const hash = window.location.hash; // "#/auth/callback?code=..."
        const queryString = hash.split('?')[1] || '';
        const params = new URLSearchParams(queryString);
        const code = params.get('code');

        if (!code) {
          navigate('/login', { replace: true });
          return;
        }

        // Monta uma URL "fake" porém válida para o Supabase processar
        // (ele só precisa ver `?code=...` e bater com o redirect permitido)
        const redirectLikeUrl = `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(code)}`;

        const { data, error } = await supabase.auth.exchangeCodeForSession(redirectLikeUrl);

        if (error) {
          console.error('exchangeCodeForSession error:', error);
          navigate('/login', { replace: true });
          return;
        }

        const sessionUser = data?.session?.user ?? null;
        if (!sessionUser) {
          console.warn('Callback sem session user. Indo para login.');
          navigate('/login', { replace: true });
          return;
        }

        // ✅ Vai para área do cliente; depois a lógica de perfil decide se é admin/client
        navigate('/client', { replace: true });
      } catch (e) {
        console.error('AuthCallback error:', e);
        navigate('/login', { replace: true });
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