import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/change-password',
  '/reset-password',
  '/403',
  '/404',
  '/',
  '/services',
  '/about',
  '/contact',
  '/init-admin',
  '/approve',
  '/rastrear-os',

  // ✅ OAuth callback NUNCA deve ser guardado
  '/auth/callback',
];

function isPublic(path: string) {
  return PUBLIC_ROUTES.some((route) => {
    return path === route || path.startsWith(route + '/');
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ⚠️ nunca interfere no callback
    if (location.pathname.startsWith('/auth/callback')) {
      return;
    }

    if (loading) return;

    if (!user && !isPublic(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}