import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

function getCodeFromUrl(): string | null {
  // Caso A: volta como /?code=...#/login  (code no search)
  const searchParams = new URLSearchParams(window.location.search);
  const codeFromSearch = searchParams.get('code');
  if (codeFromSearch) return codeFromSearch;

  // Caso B: volta como /#/auth/callback?code=... (code dentro do hash)
  const hash = window.location.hash || '';
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const hashParams = new URLSearchParams(queryString);
  const codeFromHash = hashParams.get('code');
  if (codeFromHash) return codeFromHash;

  return null;
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const code = getCodeFromUrl();

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

        // ✅ limpa o ?code= da barra (evita reprocessar em reload)
        try {
          const cleanUrl = `${window.location.origin}${window.location.pathname}#/client`;
          window.history.replaceState({}, '', cleanUrl);
        } catch {}

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
