import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackSessionStart,
  trackPageView,
  setupClickTracking,
  shouldRunAnalytics,
} from '@/services/analytics';

export function AnalyticsTracker() {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!shouldRunAnalytics()) return;

    if (!initialized.current) {
      trackSessionStart().catch(() => {});
      setupClickTracking();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!shouldRunAnalytics()) return;

    const path = location.pathname;
    const timer = setTimeout(() => {
      trackPageView(path, document.title || path).catch(() => {});
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}
