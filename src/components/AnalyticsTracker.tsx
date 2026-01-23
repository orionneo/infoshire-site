// src/components/AnalyticsTracker.tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldRunAnalytics, trackSessionStart, trackPageView, setupClickTracking } from '@/services/analytics';

const ANALYTICS_ENABLED = String(import.meta.env.VITE_ANALYTICS_ENABLED || 'true') === 'true';

function currentRoutePath(location: { pathname: string; hash?: string }): string {
  const hash = (location.hash || '').trim();
  if (hash.startsWith('#')) {
    const path = hash.slice(1);
    return path.startsWith('/') ? path : `/${path}`;
  }
  return location.pathname || '/';
}

export function AnalyticsTracker() {
  const location = useLocation();
  const path = currentRoutePath(location);

  // 🚫 CRITICAL: Never run analytics in admin - check both hash and pathname
  const isAdminRoute = path.startsWith('/admin') || location.hash.startsWith('#/admin') || location.pathname.startsWith('/admin');
  if (isAdminRoute) return null;
  const initialized = useRef(false);

  const enabled = ANALYTICS_ENABLED && shouldRunAnalytics();

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

    const timer = setTimeout(() => {
      trackPageView(path, document.title || path).catch(() => {});
    }, 100);

    return () => clearTimeout(timer);
  }, [path, enabled]);

  return null;
}
