import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

function getOAuthCodeFromUrl() {
  // 1) code no search (antes do #) -> /?code=XXX#/login
  const searchParams = new URLSearchParams(window.location.search);
  const codeFromSearch = searchParams.get('code');
  if (codeFromSearch) return codeFromSearch;

  // 2) code no hash -> #/auth/callback?code=XXX
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
        const code = getOAuthCodeFromUrl();

        if (!code) {
          navigate('/login', { replace: true });
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[AuthCallback] exchangeCodeForSession error:', error);
          navigate('/login', { replace: true });
          return;
        }

        // ✅ Limpa o ?code= do search pra não reprocessar ao recarregar
        const cleanUrl = `${window.location.origin}${window.location.pathname}#${window.location.hash.split('?')[0] || '/'}`
          .replace('##', '#');
        window.history.replaceState({}, '', cleanUrl);

        navigate('/client', { replace: true });
      } catch (e) {
        console.error('[AuthCallback] error:', e);
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
