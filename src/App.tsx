import React from 'react';
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

// ✅ executa antes do Supabase/AuthProvider montar (evita AbortError)
function preHandleOAuthCode() {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    // Se voltou do Google como "/?code=...#/login" ou "/?code=..."
    // e ainda não está em "#/auth/callback", reescreve tudo
    if (code && !window.location.hash.includes('/auth/callback')) {
      const newUrl = `${window.location.origin}${window.location.pathname}#/auth/callback?code=${encodeURIComponent(code)}`;
      window.location.replace(newUrl);
      return true; // interrompe render
    }

    return false;
  } catch {
    return false;
  }
}

const App: React.FC = () => {
  // ✅ se tiver code, já redirecionou e não renderiza nada agora
  if (typeof window !== 'undefined' && preHandleOAuthCode()) {
    return null;
  }

  return (
    <Router>
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
    </Router>
  );
};

export default App;