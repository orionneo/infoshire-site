// src/services/analytics.ts
import { supabase } from '@/db/supabase';

// ============================================
// CONSTANTS / FLAGS (anti-loop e anti-travamento)
// ============================================

const DISABLE_KEY = 'analytics_disabled_until';
const VISITOR_KEY = 'analytics_visitor_id';
const SESSION_KEY = 'analytics_session_id';
const SESSION_STARTED_KEY = 'analytics_session_started';

const DISABLE_ON_RLS_MINUTES = 60 * 24; // 24h
const DISABLE_ON_AUTH_MINUTES = 60 * 24; // 24h
const DISABLE_ON_NETWORK_MINUTES = 10; // 10 min

const HEARTBEAT_MS = 15000;

// ✅ Fallback em memória (quando Tracking Prevention bloqueia storage)
let __memDisabledUntil = 0;

// ============================================
// SAFE STORAGE
// ============================================

function safeGet(storage: Storage | null, key: string): string | null {
  try {
    if (!storage) return null;
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | null, key: string, value: string): void {
  try {
    if (!storage) return;
    storage.setItem(key, value);
  } catch {
    // ignore
  }
}

function nowMs(): number {
  return Date.now();
}

function disableAnalyticsForMinutes(minutes: number) {
  const until = nowMs() + minutes * 60 * 1000;
  __memDisabledUntil = Math.max(__memDisabledUntil, until);
  safeSet(sessionStorage, DISABLE_KEY, String(until));
  safeSet(localStorage, DISABLE_KEY, String(until));
}

function isAnalyticsDisabled(): boolean {
  const memUntil = __memDisabledUntil;
  const v = safeGet(sessionStorage, DISABLE_KEY) || safeGet(localStorage, DISABLE_KEY);
  const storageUntil = v ? Number(v) : 0;

  const until = Math.max(
    Number.isFinite(memUntil) ? memUntil : 0,
    Number.isFinite(storageUntil) ? storageUntil : 0
  );

  if (until > __memDisabledUntil) __memDisabledUntil = until;
  return nowMs() < until;
}

// ============================================
// ROUTE DETECTION (HASH ROUTER SAFE)
// ============================================

function currentRoutePath(): string {
  // HashRouter => location.pathname is usually "/"
  // Real route is in location.hash: "#/login", "#/admin/orders", etc.
  const h = (window.location?.hash || '').trim();
  if (h.startsWith('#')) {
    const p = h.slice(1); // remove "#"
    return p.startsWith('/') ? p : `/${p}`;
  }
  return window.location?.pathname || '/';
}

const NO_ANALYTICS_PREFIXES = [
  '/admin',
  '/login',
  '/register',
  '/auth',
  '/complete-profile',
  '/forgot-password',
  '/reset-password',
  '/change-password',
];

/**
 * Decide se deve rodar analytics nesta rota/ambiente.
 */
export function shouldRunAnalytics(): boolean {
  try {
    const path = currentRoutePath();
    if (NO_ANALYTICS_PREFIXES.some((p) => path.startsWith(p))) return false;
  } catch {
    // ignore
  }

  if (isAnalyticsDisabled()) return false;
  if (isBot()) return false;

  // ✅ Evita aborts em background (muito comum em PWA/mobile)
  if (document.visibilityState !== 'visible') return false;

  return true;
}

// ============================================
// HELPERS
// ============================================

function safeUUID(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function isConflictError(err: any): boolean {
  const code = err?.code;
  const msg = String(err?.message || '').toLowerCase();
  const details = String(err?.details || '').toLowerCase();

  return (
    code === '23505' ||
    msg.includes('duplicate') ||
    msg.includes('conflict') ||
    details.includes('duplicate') ||
    details.includes('conflict')
  );
}

function isAbortError(err: any): boolean {
  return err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('signal is aborted');
}

function isRlsOrPermissionError(err: any): boolean {
  const code = String(err?.code || '');
  const msg = String(err?.message || '').toLowerCase();
  return code === '42501' || msg.includes('row-level security') || msg.includes('permission') || msg.includes('not allowed');
}

function isAuthError(err: any): boolean {
  const status = err?.status;
  const msg = String(err?.message || '').toLowerCase();
  return status === 401 || msg.includes('unauthorized') || msg.includes('jwt') || msg.includes('invalid token');
}

function isNetworkError(err: any): boolean {
  const msg = String(err?.message || '').toLowerCase();
  return !navigator.onLine || msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('timeout');
}

// Logger anti-spam (1 log a cada 10s no máximo)
let lastLogMs = 0;
function logOncePer10s(...args: any[]) {
  const t = nowMs();
  if (t - lastLogMs < 10000) return;
  lastLogMs = t;
  console.error(...args);
}

function handleAnalyticsError(context: string, err: any) {
  // ✅ AbortError é esperado (SPA navigation / background). Não desliga analytics por isso.
  if (isAbortError(err)) {
    logOncePer10s(`[ANALYTICS] ${context}: (AbortError ignorado)`, err);
    return;
  }

  if (isRlsOrPermissionError(err)) disableAnalyticsForMinutes(DISABLE_ON_RLS_MINUTES);
  if (isAuthError(err)) disableAnalyticsForMinutes(DISABLE_ON_AUTH_MINUTES);
  if (isNetworkError(err)) disableAnalyticsForMinutes(DISABLE_ON_NETWORK_MINUTES);

  logOncePer10s(`[ANALYTICS] ${context}:`, err);
}

// ============================================
// VISITOR & SESSION MANAGEMENT
// ============================================

export function getOrCreateVisitorId(): string {
  let visitorId = safeGet(localStorage, VISITOR_KEY) || safeGet(sessionStorage, VISITOR_KEY);

  if (!visitorId) {
    visitorId = safeUUID();
    safeSet(localStorage, VISITOR_KEY, visitorId);
    safeSet(sessionStorage, VISITOR_KEY, visitorId);
  }

  return visitorId;
}

export function getSessionId(): string {
  let sessionId = safeGet(sessionStorage, SESSION_KEY);

  if (!sessionId) {
    sessionId = safeUUID();
    safeSet(sessionStorage, SESSION_KEY, sessionId);
  }

  return sessionId;
}

// ============================================
// BOT / DEVICE / BROWSER
// ============================================

export function isBot(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'telegram',
  ];

  return botPatterns.some((pattern) => userAgent.includes(pattern));
}

export function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) return 'tablet';
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)
  )
    return 'mobile';

  return 'desktop';
}

export function getBrowser(): string {
  const userAgent = navigator.userAgent;

  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';

  return 'Other';
}

// ============================================
// SESSION TRACKING (mantive seu código, só com guards anti-abort)
// ============================================

let sessionStartTime: number | null = null;
let durationUpdateInterval: any | null = null;

export async function trackSessionStart(): Promise<boolean> {
  try {
    if (!shouldRunAnalytics()) return false;
    if (safeGet(sessionStorage, SESSION_STARTED_KEY) === 'true') return true;

    const sessionId = getSessionId();
    const visitorId = getOrCreateVisitorId();

    // ✅ se não tiver sessão auth, não tente (evita log spam)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return false;

    const { error: sessionError } = await supabase.from('analytics_sessions').insert({
      session_id: sessionId,
      visitor_id: visitorId,
      first_visit: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      page_count: 1,
      duration_seconds: 0,
      is_bot: isBot(),
      device_type: getDeviceType(),
      browser: getBrowser(),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      page_entry: currentRoutePath(),
    });

    if (sessionError && !isConflictError(sessionError)) {
      handleAnalyticsError('Erro ao inserir sessão', sessionError);
    }

    safeSet(sessionStorage, SESSION_STARTED_KEY, 'true');
    sessionStartTime = nowMs();

    startDurationHeartbeat();
    return true;
  } catch (error) {
    handleAnalyticsError('Erro ao iniciar sessão (catch)', error);
    return false;
  }
}

function startDurationHeartbeat() {
  if (durationUpdateInterval) clearInterval(durationUpdateInterval);

  durationUpdateInterval = setInterval(() => {
    if (!shouldRunAnalytics()) return;
    if (!navigator.onLine) return;
    if (document.visibilityState !== 'visible') return;
    void updateSessionDuration();
  }, HEARTBEAT_MS);

  window.addEventListener('beforeunload', () => {
    void updateSessionDuration();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      void updateSessionDuration();
    }
  });
}

async function updateSessionDuration() {
  try {
    if (!shouldRunAnalytics()) return;
    if (!navigator.onLine) return;
    if (!sessionStartTime) return;

    const sessionId = getSessionId();
    const durationSeconds = Math.floor((nowMs() - sessionStartTime) / 1000);

    const { error } = await supabase
      .from('analytics_sessions')
      .update({
        duration_seconds: durationSeconds,
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (error && !isConflictError(error)) {
      handleAnalyticsError('Erro ao atualizar duração', error);
    }
  } catch (e) {
    handleAnalyticsError('Erro ao atualizar duração (catch)', e);
  }
}

const trackedPages = new Set<string>();

export async function trackPageView(path: string, title: string): Promise<boolean> {
  try {
    if (!shouldRunAnalytics()) return false;
    if (!navigator.onLine) return false;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return false;

    const sessionId = getSessionId();
    const visitorId = getOrCreateVisitorId();

    const pageKey = `${sessionId}-${path}`;
    if (trackedPages.has(pageKey)) return true;

    const { error } = await supabase
      .from('analytics_pageviews')
      .upsert(
        {
          session_id: sessionId,
          visitor_id: visitorId,
          page_path: path,
          page_title: title,
          time_on_page: 0,
        },
        {
          onConflict: 'session_id,page_path',
          ignoreDuplicates: true,
        }
      );

    if (error && !isConflictError(error)) {
      handleAnalyticsError('Erro ao rastrear pageview', error);
      return false;
    }

    trackedPages.add(pageKey);
    return true;
  } catch (error) {
    handleAnalyticsError('Erro ao rastrear pageview (catch)', error);
    return false;
  }
}

const trackedEvents = new Set<string>();

export async function trackEvent(eventType: string, eventLabel?: string, pagePath?: string): Promise<boolean> {
  try {
    if (!shouldRunAnalytics()) return false;
    if (!navigator.onLine) return false;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return false;

    const sessionId = getSessionId();
    const visitorId = getOrCreateVisitorId();

    const eventKey = `${sessionId}-${eventType}-${eventLabel || ''}`;
    if (trackedEvents.has(eventKey)) return true;

    const { error } = await supabase.from('analytics_events').insert({
      session_id: sessionId,
      visitor_id: visitorId,
      event_type: eventType,
      event_label: eventLabel || null,
      page_path: pagePath || currentRoutePath(),
    });

    if (error && !isConflictError(error)) {
      handleAnalyticsError('Erro ao rastrear evento', error);
      return false;
    }

    trackedEvents.add(eventKey);
    return true;
  } catch (error) {
    handleAnalyticsError('Erro ao rastrear evento (catch)', error);
    return false;
  }
}

export function setupClickTracking() {
  const KEY = '__analytics_click_tracking_attached__';
  if ((window as any)[KEY]) return;
  (window as any)[KEY] = true;

  document.addEventListener('click', (e) => {
    if (!shouldRunAnalytics()) return;

    const target = e.target as HTMLElement;
    const clickable = target?.closest?.('a, button, [role="button"], [onclick]') as HTMLElement | null;
    if (!clickable) return;

    const href = clickable.getAttribute('href') || '';
    const dataEvent = clickable.getAttribute('data-analytics-event');
    const textContent = clickable.textContent?.toLowerCase() || '';
    const ariaLabel = clickable.getAttribute('aria-label')?.toLowerCase() || '';
    const title = clickable.getAttribute('title')?.toLowerCase() || '';

    const allText = `${textContent} ${ariaLabel} ${title}`.toLowerCase();

    if (
      href.includes('wa.me') ||
      href.includes('whatsapp') ||
      href.includes('api.whatsapp.com') ||
      dataEvent === 'whatsapp_click' ||
      allText.includes('whatsapp') ||
      allText.includes('zap')
    ) {
      void trackEvent('whatsapp_click', 'WhatsApp Contact');
    }
  });
}
