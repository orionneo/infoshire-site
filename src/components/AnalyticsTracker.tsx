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
  // 🚫 ANALYTICS COMPLETELY DISABLED - causing redirect loops and RLS violations
  // No analytics should run - comment out all tracking
  return null;
}
