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
  '/complete-profile', // ✅ permitir a tela de completar telefone
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

function hasValidPhone(phone?: string | null) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length >= 10; // 10 ou 11 normalmente
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // 1) Sem user e rota protegida => login
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // 2) Com user, mas sem profile carregado ainda: não redireciona aqui (evita loop)
    // (AuthContext resolve o profile)
    if (user && !profile) return;

    // 3) Com user e profile, força completar telefone para áreas protegidas
    if (
      user &&
      profile &&
      !hasValidPhone(profile.phone) &&
      !isPublic &&
      location.pathname !== '/complete-profile'
    ) {
      navigate('/complete-profile', { replace: true });
      return;
    }
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