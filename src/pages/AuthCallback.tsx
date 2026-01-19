import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        // ✅ 1) tenta pegar code do hash: "#/auth/callback?code=XXXX"
        const hash = window.location.hash || '';
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const hashParams = new URLSearchParams(hashQuery);
        const codeFromHash = hashParams.get('code');

        // ✅ 2) fallback: pega code do search: "?code=XXXX"
        const searchParams = new URLSearchParams(window.location.search);
        const codeFromSearch = searchParams.get('code');

        const code = codeFromHash || codeFromSearch;

        if (!code) {
          navigate('/login', { replace: true });
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('exchangeCodeForSession error:', error);
          navigate('/login', { replace: true });
          return;
        }

        // ✅ limpa o ?code=... pra não reprocessar
        const cleanUrl = `${window.location.origin}${window.location.pathname}#/client`;
        window.history.replaceState({}, '', cleanUrl);

        // sucesso
        navigate('/client', { replace: true });
      } catch (e) {
        console.error('AuthCallback error:', e);
        navigate('/login', { replace: true });
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Finalizando login...</div>
    </div>
  );
}