import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { secureTabStorage } from '@/utils/secureTabStorage';

/**
 * Componente para prevenir perda de estado quando o app é minimizado no mobile
 * Salva a rota atual e scroll position automaticamente
 * ✅ CRITICAL: Admin routes (#/admin/*) são sempre ignoradas
 */
export function StatePersistence({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Check admin status from BOTH hash and pathname
  const isAdminRoute = location.hash.startsWith('#/admin') || location.pathname.startsWith('/admin');

  useEffect(() => {
    // 🚫 CRITICAL: Never restore routes for admin
    if (isAdminRoute) {
      // Clear any saved state that might redirect away from admin
      try {
        secureTabStorage.removeItem('app_last_route');
        secureTabStorage.removeItem('app_scroll_y');
      } catch (e) {
        // Ignore errors if storage is blocked/cleared
      }
      return;
    }

    // Restaurar posição de scroll e rota ao montar
    const savedRoute = secureTabStorage.getItem('app_last_route');
    const savedScrollY = secureTabStorage.getItem('app_scroll_y');

    if (savedRoute && savedRoute !== location.pathname && savedRoute !== '/') {
      // ✅ Validate savedRoute doesn't contain admin paths
      if (!savedRoute.includes('/admin') && !savedRoute.includes('#/admin')) {
        navigate(savedRoute, { replace: true });
      }
    }

    if (savedScrollY) {
      try {
        window.scrollTo(0, parseInt(savedScrollY, 10));
      } catch (e) {
        // Ignore scroll errors
      }
    }

    // Limpar dados salvos após restaurar
    try {
      secureTabStorage.removeItem('app_last_route');
      secureTabStorage.removeItem('app_scroll_y');
    } catch (e) {
      // Ignore errors
    }
  }, [isAdminRoute, location, navigate]);

  useEffect(() => {
    // 🚫 Never save admin routes
    if (isAdminRoute) {
      try {
        secureTabStorage.removeItem('app_last_route');
        secureTabStorage.removeItem('app_scroll_y');
      } catch (e) {
        // Ignore errors
      }
      return;
    }

    try {
      if (!secureTabStorage.setItem('app_last_route', location.pathname)) {
        return;
      }
      secureTabStorage.setItem('app_scroll_y', window.scrollY.toString());
    } catch (error) {
      console.warn('Erro ao salvar estado de navegação:', error);
    }
  }, [location.pathname, isAdminRoute]);

  return <>{children}</>;
}
