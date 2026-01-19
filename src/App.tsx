import React, { useEffect } from 'react';
import { Navigate, Route, HashRouter as Router, Routes, useNavigate } from 'react-router-dom';
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

function OAuthBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    // Se já estamos no callback, não mexe
    const hash = window.location.hash || '';
    const alreadyOnCallback = hash.startsWith('#/auth/callback');

    if (code && !alreadyOnCallback) {
      // Reescreve URL para o HashRouter entender
      const newUrl = `${window.location.origin}${window.location.pathname}#/auth/callback?code=${encodeURIComponent(code)}`;
      window.history.replaceState({}, '', newUrl);

      navigate('/auth/callback', { replace: true });
    }
  }, [navigate]);

  return null;
}

const AppInner: React.FC = () => {
  return (
    <>
      <OAuthBridge />

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
            <ConnectionStatus />
            <Toaster />
          </RouteGuard>
        </StatePersistence>
      </AuthProvider>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppInner />
    </Router>
  );
};

export default App;