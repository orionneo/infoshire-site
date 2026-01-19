import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // ainda não tem user? manda pro login (mas sem loop agressivo)
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    navigate('/client', { replace: true });
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm opacity-80">Concluindo login...</div>
    </div>
  );
}