import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Pages that can be accessed without logging in
const PUBLIC_ROUTES = [
  '/', // home
  '/login',
  '/register',
  '/forgot-password',
  '/change-password',
  '/reset-password/*',
  '/auth/callback', // ✅ IMPORTANT: OAuth finalization route must be public
  '/403',
  '/404',
  '/services',
  '/about',
  '/contact',
  '/init-admin',
  '/approve/*',
  '/rastrear-os',
];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some((pattern) => {
    if (pattern.includes('*')) {
      // convert "/reset-password/*" -> "^/reset-password/.*$"
      const [prefix] = pattern.split('*');
      const regex = new RegExp('^' + escapeRegExp(prefix) + '.*$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ✅ Don't redirect while auth is still initializing
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [user, loading, location.pathname, navigate, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}