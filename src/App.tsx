import React, { useEffect } from 'react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
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
  useEffect(() => {
    // Google volta pro GH Pages como:
    // https://orionneo.github.io/infoshire-site/?code=XXXX#/login
    // A gente reescreve para:
    // https://orionneo.github.io/infoshire-site/#/auth/callback?code=XXXX

    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    const base = import.meta.env.BASE_URL || '/';
    const target = `${window.location.origin}${base}#/auth/callback?code=${encodeURIComponent(code)}`;
    window.history.replaceState({}, '', target);
  }, []);

  return null;
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <StatePersistence>
          <RouteGuard>
            <ScrollToTop />
            <IntersectObserver />
            <AnalyticsTracker />
            <GlobalGamerBackground />

            <OAuthBridge />

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
    </Router>
  );
};

export default App;
