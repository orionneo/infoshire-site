import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { secureTabStorage } from '@/utils/secureTabStorage';

/**
 * Componente para prevenir perda de estado quando o app é minimizado no mobile
 * Salva a rota atual e scroll position automaticamente
 * 🚫 COMPLETAMENTE DESABILITADO PARA ADMIN - nenhuma operação de storage
 */
export function StatePersistence({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Detect admin from BOTH hash and pathname
  const isAdminRoute = location.hash.startsWith('#/admin') || location.pathname.startsWith('/admin');

  // 🚫 CRITICAL: ZERO storage operations when admin is active
  // This prevents "Tracking Prevention blocked access to storage" errors
  // that cause navigation loops and UI freezes
  useEffect(() => {
    // SKIP EVERYTHING for admin routes
    if (isAdminRoute) {
      return;
    }

    // Non-admin: restore position and route if available
    try {
      const savedRoute = secureTabStorage.getItem('app_last_route');
      const savedScrollY = secureTabStorage.getItem('app_scroll_y');

      if (savedRoute && savedRoute !== location.pathname && savedRoute !== '/') {
        // Validate no admin paths
        if (!savedRoute.includes('/admin') && !savedRoute.includes('#/admin')) {
          navigate(savedRoute, { replace: true });
        }
      }

      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY, 10));
      }

      // Cleanup saved route after restore
      secureTabStorage.removeItem('app_last_route');
      secureTabStorage.removeItem('app_scroll_y');
    } catch (e) {
      // Ignore storage errors - user can lose position, that's OK
    }
  }, [isAdminRoute, location, navigate]);

  // 🚫 Save position only for non-admin routes
  useEffect(() => {
    // SKIP for admin - zero storage writes
    if (isAdminRoute) {
      return;
    }

    try {
      secureTabStorage.setItem('app_last_route', location.pathname);
      secureTabStorage.setItem('app_scroll_y', window.scrollY.toString());
    } catch (e) {
      // Ignore storage errors - optional feature
    }
  }, [location.pathname, isAdminRoute]);

  return <>{children}</>;
}
