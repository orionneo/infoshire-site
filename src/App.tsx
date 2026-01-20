// src/App.tsx
import React, { useEffect } from 'react';
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

function AppShell() {
  const location = useLocation();

  // Mostra checagem de conexão APENAS em rotas autenticadas
  const showConnectionStatus =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/client');

  useEffect(() => {
    const onOnline = () => {
      console.log('🌐 Conexão restaurada, processando fila offline...');
      processOfflineQueue();
    };

    const onFocus = () => {
      // ao voltar pro PWA/aba, tenta drenar fila
      processOfflineQueue();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);

    // Também processa ao abrir o site
    const t = window.setTimeout(() => processOfflineQueue(), 3000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <AuthProvider>
      <StatePersistence>
        <RouteGuard>
          <ScrollToTop />
          <IntersectObserver />
          <AnalyticsTracker />
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
