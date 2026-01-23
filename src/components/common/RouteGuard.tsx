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
  '/reset-password/*',
  '/403',
  '/404',
  '/',
  '/services',
  '/about',
  '/contact',
  '/init-admin',
  '/approve/*',
  '/rastrear-os',
  '/auth/callback',
  '/complete-profile',
];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);
    const isAdmin = location.pathname.startsWith('/admin');

    // 1) Sem user e rota protegida => login
    if (!user && !isPublic && !isAdmin) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // 2) Admin route sem user => login (AdminGuard vai validar role depois)
    if (!user && isAdmin) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // 3) Com user, mas sem profile carregado ainda: NÃO redireciona (evita loop)
    // AdminGuard.tsx será responsável de validar se é admin após profile carregar
    if (user && !profile) return;

    // ✅ Phone redirect fica no AuthContext (evita lógica duplicada/loop)
  }, [user, profile, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}