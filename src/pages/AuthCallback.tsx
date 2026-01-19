import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        // Quando vier via "ponte", a URL será:
        // https://.../infoshire-site/#/auth/callback?code=XXXX
        // então o code está dentro do hash após "?"
const hash = window.location.hash;
const queryString = hash.split('?')[1] || '';
const params = new URLSearchParams(queryString);
const code = params.get('code');

        if (!code) {
          // sem code -> manda pro login
          navigate('/login', { replace: true });
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('exchangeCodeForSession error:', error);
          navigate('/login', { replace: true });
          return;
        }

        // sucesso -> entra
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