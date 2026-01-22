// src/components/AnalyticsTracker.tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackSessionStart, trackPageView, setupClickTracking } from '@/services/analytics';

const ANALYTICS_ENABLED = String(import.meta.env.VITE_ANALYTICS_ENABLED || 'true') === 'true';

export function AnalyticsTracker() {
  const location = useLocation();

  // ✅ Nunca rodar analytics no admin
  if (location.pathname.startsWith('/admin')) return null;
  const initialized = useRef(false);

  const isPrivateRoute =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/client');

  const enabled = ANALYTICS_ENABLED && !isPrivateRoute;

  useEffect(() => {
    if (!enabled) return;

    if (!initialized.current) {
      trackSessionStart().catch(() => {});
      setupClickTracking();
      initialized.current = true;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const path = location.pathname;
    const timer = setTimeout(() => {
      trackPageView(path, document.title || path).catch(() => {});
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, enabled]);

  return null;
}
