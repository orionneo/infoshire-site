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
  const isAdminRoute = () =>
    location.hash.startsWith('#/admin');

  // Mostra checagem de conexão APENAS em rotas autenticadas
  const showConnectionStatus = location.pathname.startsWith('/client') && !isAdminRoute();

  useEffect(() => {
  // 🚫 Admin NÃO usa fila offline e esse drain em "visibilitychange" pode gerar lock/AbortError no Supabase Auth
  if (isAdminRoute()) return;

  const drain = () => {
    // não bloqueia UI, só tenta sincronizar
    void processOfflineQueue();
  };

  const onOnline = () => {
    console.log('🌐 Conexão restaurada, processando fila offline...');
    drain();
  };

  const onFocus = () => {
    // desktop/alguns browsers
    drain();
  };

  const onVisibility = () => {
    // PWA/mobile: mais confiável que focus
    if (document.visibilityState === 'visible') {
      drain();
    }
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisibility);

  // Também processa ao abrir o site (leve atraso pra não competir com mount/auth)
  const t = window.setTimeout(() => drain(), 1500);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisibility);
    window.clearTimeout(t);
  };
}, [location.hash]);

  useEffect(() => {
    const shouldEnable = () =>
      !window.location.hash.startsWith('#/admin');

    const updateListeners = () => {
      const enabled = shouldEnable();
      if (enabled && !autoSyncCleanupRef.current) {
        autoSyncCleanupRef.current = installAutoSyncListeners();
      }
      if (!enabled && autoSyncCleanupRef.current) {
        autoSyncCleanupRef.current();
        autoSyncCleanupRef.current = null;
      }
    };

    updateListeners();
    window.addEventListener('hashchange', updateListeners);
    window.addEventListener('popstate', updateListeners);

    return () => {
      window.removeEventListener('hashchange', updateListeners);
      window.removeEventListener('popstate', updateListeners);
      if (autoSyncCleanupRef.current) {
        autoSyncCleanupRef.current();
        autoSyncCleanupRef.current = null;
      }
    };
  }, []);


  return (
    <AuthProvider>
      <StatePersistence>
        <RouteGuard>
          <ScrollToTop />
          <IntersectObserver />
          {!isAdminRoute() ? <AnalyticsTracker /> : null}
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
