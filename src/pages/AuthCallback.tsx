import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Supabase retorna ?code=... no callback (PKCE)
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (!code) {
          navigate('/login', { replace: true });
          return;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        // limpa ?code=... pra não dar loop
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url.toString());

        if (cancelled) return;

        // Se já temos session, manda pro portal
        if (data?.session?.user) {
          navigate('/client', { replace: true });
          return;
        }

        navigate('/login', { replace: true });
      } catch (e) {
        console.error('AuthCallback error:', e);
        navigate('/login', { replace: true });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Concluindo login…</h2>
        <p>Se essa tela não sair em alguns segundos, volte e tente novamente.</p>
      </div>
    </div>
  );
}