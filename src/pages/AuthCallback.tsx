import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let finished = false;

    const go = (to: string) => {
      if (finished) return;
      finished = true;
      navigate(to, { replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          go('/client');
        }
      }
    );

    const run = async () => {
      for (let i = 0; i < 25; i++) {
        const { data, error } = await supabase.auth.getSession();

        if (data?.session?.user) {
          go('/client');
          return;
        }

        if (error) {
          console.warn('AuthCallback getSession error', error);
        }

        await new Promise((r) => setTimeout(r, 150));
      }

      go('/login');
    };

    run();

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}