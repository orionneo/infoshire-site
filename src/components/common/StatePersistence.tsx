import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { secureTabStorage } from '@/utils/secureTabStorage';

/**
 * 🚫 DISABLED: StatePersistence is causing redirect loops
 * Admin pages now properly detect via RouteGuard
 * This component is kept for future use but does nothing
 */
export function StatePersistence({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // ✅ DO NOTHING - StatePersistence disabled to prevent redirect loops
  useEffect(() => {
    // Clear any stale storage that might cause redirects
    if (location.hash.startsWith('#/admin') || location.pathname.startsWith('/admin')) {
      try {
        secureTabStorage.removeItem('app_last_route');
        secureTabStorage.removeItem('app_scroll_y');
      } catch (e) {
        // Ignore
      }
    }
  }, [location]);

  return <>{children}</>;
}
