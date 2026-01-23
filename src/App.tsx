// src/App.tsx
import React, { useEffect, useRef } from 'react';
import { Navigate, Route, HashRouter as Router, Routes, useLocation } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { RouteGuard } from '@/components/common/RouteGuard';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { StatePersistence } from '@/components/common/StatePersistence';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import GlobalGamerBackground from '@/components/GlobalGamerBackground';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import routes from './routes';
import { processOfflineQueue } from '@/utils/processOfflineQueue';
import { installAutoSyncListeners } from '@/utils/autoSync';

function AppShell() {
  const location = useLocation();
  const autoSyncCleanupRef = useRef<null | (() => void)>(null);
  const isAdminRoute =
    location.hash.startsWith('#/admin') || location.pathname.startsWith('/admin');

  // Mostra checagem de conexão APENAS em rotas autenticadas
  const showConnectionStatus = location.pathname.startsWith('/client') && !isAdminRoute;

  // ✅ CRITICAL FIX: Admin routes MUST NOT respond to lifecycle events
  // Lifecycle handlers disabled for admin to prevent session suspension
  useEffect(() => {
    // 🚫 Admin NÃO usa fila offline nem listeners de lifecycle
    if (isAdminRoute) return;

    const drain = () => {
      void processOfflineQueue();
    };

    const onOnline = () => {
      console.log('🌐 Conexão restaurada, processando fila offline...');
      drain();
    };

    const onFocus = () => {
      drain();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        drain();
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    const t = window.setTimeout(() => drain(), 1500);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(t);
    };
  }, [isAdminRoute]);

  // ✅ Disable autoSync listeners for admin routes
  useEffect(() => {
    if (!isAdminRoute && !autoSyncCleanupRef.current) {
      autoSyncCleanupRef.current = installAutoSyncListeners();
    }

    if (isAdminRoute && autoSyncCleanupRef.current) {
      autoSyncCleanupRef.current();
      autoSyncCleanupRef.current = null;
    }

    return () => {
      if (autoSyncCleanupRef.current) {
        autoSyncCleanupRef.current();
        autoSyncCleanupRef.current = null;
      }
    };
  }, [isAdminRoute]);


  return (
    <AuthProvider>
      <StatePersistence>
        <RouteGuard>
          <ScrollToTop />
          <IntersectObserver />
          {!isAdminRoute && <AnalyticsTracker />}
          <GlobalGamerBackground />

          <div className="flex flex-col min-h-screen relative z-10">
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element} />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          <PWAInstallPrompt />
          {showConnectionStatus ? <ConnectionStatus enabled failThreshold={3} /> : null}
          <Toaster />
        </RouteGuard>
      </StatePersistence>
    </AuthProvider>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AppShell />
    </Router>
  );
};

export default App;
