import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

function getCodeFromUrl(): string | null {
  // caso normal: /auth/callback?code=...
  const url = new URL(window.location.href);
  const codeFromSearch = url.searchParams.get('code');
  if (codeFromSearch) return codeFromSearch;

  // caso HashRouter: /#/auth/callback?code=...
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const qs = hash.slice(qIndex + 1);
    const p = new URLSearchParams(qs);
    return p.get('code');
  }

  return null;
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const code = getCodeFromUrl();
        if (!code) {
          navigate('/login', { replace: true });
          return;
        }

        // ✅ IMPORTANTE: o exchangeCodeForSession recebe o CODE (string), não a URL
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('exchangeCodeForSession error:', error);
          navigate('/login', { replace: true });
          return;
        }

        // Com sessão criada, manda pro destino padrão
        navigate('/client', { replace: true });
      } catch (e) {
        console.error('AuthCallback error:', e);
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm opacity-80">Finalizando login...</div>
    </div>
  );
}