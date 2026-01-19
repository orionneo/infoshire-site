import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        navigate('/client', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };

    run();
  }, [navigate]);

  return null;
}