import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAdminUser } from '@/config/admin';
import { useAuth } from '@/providers/AuthProvider'; // ajuste o caminho se o seu hook tiver outro nome

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;

    // se não está logado, manda pro login
    if (!user) {
      nav('/login', { replace: true, state: { from: loc.pathname } });
      return;
    }

    // se não é admin, expulsa
    if (!isAdminUser(user)) {
      nav('/', { replace: true });
    }
  }, [user, loading, nav, loc.pathname]);

  if (loading) return null;

  // se não é admin, enquanto redireciona não renderiza
  if (!user || !isAdminUser(user)) return null;

  return <>{children}</>;
}
