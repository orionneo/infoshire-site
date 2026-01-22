// src/services/analytics.ts
import { supabase } from '@/db/supabase';

// ============================================
// CONSTANTS / FLAGS (anti-loop e anti-travamento)
// ============================================

const DISABLE_KEY = 'analytics_disabled_until';
const VISITOR_KEY = 'analytics_visitor_id';
const SESSION_KEY = 'analytics_session_id';
const SESSION_STARTED_KEY = 'analytics_session_started';

// Quanto tempo desliga quando der erro (pra não ficar batendo infinito)
const DISABLE_ON_RLS_MINUTES = 60 * 24; // 24h
const DISABLE_ON_AUTH_MINUTES = 60 * 24; // 24h
const DISABLE_ON_NETWORK_MINUTES = 10; // 10 min

// Heartbeat agressivo causa spam e lag; 15s é muito mais seguro
const HEARTBEAT_MS = 15000;

// ✅ Fallback em memória (quando Tracking Prevention bloqueia storage)
let __memDisabledUntil = 0;

// ============================================
// SAFE STORAGE (Tracking Prevention / iOS / Private mode)
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
    // ignorar (tracking prevention / private)
  }
}

function nowMs(): number {
  return Date.now();
}

function disableAnalyticsForMinutes(minutes: number) {
  const until = nowMs() + minutes * 60 * 1000;

  // ✅ Sempre mantém um fallback em memória (caso o browser bloqueie storage)
  __memDisabledUntil = Math.max(__memDisabledUntil, until);

  // tenta sessionStorage primeiro (menos bloqueado), depois localStorage
  safeSet(sessionStorage, DISABLE_KEY, String(until));
  safeSet(localStorage, DISABLE_KEY, String(until));
}

function isAnalyticsDisabled(): boolean {
  // ✅ Primeiro: fallback em memória (funciona mesmo com Tracking Prevention)
  const memUntil = __memDisabledUntil;

  const v = safeGet(sessionStorage, DISABLE_KEY) || safeGet(localStorage, DISABLE_KEY);
  const storageUntil = v ? Number(v) : 0;

  const until = Math.max(
    Number.isFinite(memUntil) ? memUntil : 0,
    Number.isFinite(storageUntil) ? storageUntil : 0
  );

  // mantém memória em sync (se storage tiver valor maior)
  if (until > __memDisabledUntil) __memDisabledUntil = until;

  return nowMs() < until;
}

/**
 * Decide se deve rodar analytics nesta rota/ambiente.
 * - Não roda no /admin (admin não precisa de tracking público e pode causar erros/ruído)
 * - Não roda em rotas de auth (login/register/reset etc) para não interferir com flows/sessão
 * - Não roda se estiver desabilitado por falhas anteriores (RLS/401/rede)
 * - Não roda para bots
 */
export function shouldRunAnalytics(): boolean {
  try {
    const path = window.location?.pathname || '';

    // ✅ Admin (nunca roda)
    if (path.startsWith('/admin')) return false;

    // ✅ Rotas sensíveis de auth (não roda para não “concorrer” com login / session restore)
    const authRoutes = [
      '/login',
      '/register',
      '/auth/callback',
      '/complete-profile',
      '/forgot-password',
      '/reset-password',
      '/change-password',
    ];
    if (authRoutes.some((r) => path === r || path.startsWith(r + '/'))) return false;
  } catch {
    // ignore
  }

  // ✅ Não roda em background (evita AbortError por lifecycle do mobile/PWA)
  try {
    if (document.visibilityState !== 'visible') return false;
  } catch {
    // ignore
  }

  if (isAnalyticsDisabled()) return false;
  if (isBot()) return false;

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

function isRlsOrPermissionError(err: any): boolean {
  const code = String(err?.code || '');
  const msg = String(err?.message || '').toLowerCase();
  // 42501 = insufficient_privilege
  return code === '42501' || msg.includes('row-level security') || msg.includes('permission') || msg.includes('not allowed');
}

function isAuthError(err: any): boolean {
  const status = err?.status;
  const msg = String(err?.message || '').toLowerCase();
  return status === 401 || msg.includes('unauthorized') || msg.includes('jwt') || msg.includes('invalid token');
}

function isAbortError(err: any): boolean {
  return err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('aborted');
}

function isNetworkError(err: any): boolean {
  const msg = String(err?.message || '').toLowerCase();
  return (
    !navigator.onLine ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('timeout')
  );
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
  // ✅ AbortError é normal em navegação/background no mobile/PWA
  // Não desabilita analytics por 24h e não “polui” log.
  if (isAbortError(err)) {
    // no máximo loga raramente
    logOncePer10s(`[ANALYTICS] ${context}:`, err);
    return;
  }

  // se forem erros de permissão, desliga por 24h
  if (isRlsOrPermissionError(err)) disableAnalyticsForMinutes(DISABLE_ON_RLS_MINUTES);
  if (isAuthError(err)) disableAnalyticsForMinutes(DISABLE_ON_AUTH_MINUTES);
  if (isNetworkError(err)) disableAnalyticsForMinutes(DISABLE_ON_NETWORK_MINUTES);

  logOncePer10s(`[ANALYTICS] ${context}:`, err);
}

// ============================================
// VISITOR & SESSION MANAGEMENT
// ============================================

export function getOrCreateVisitorId(): string {
  // tenta localStorage, se falhar usa sessionStorage, se falhar gera “ephemeral”
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
// TRAFFIC SOURCE DETECTION
// ============================================

export function detectTrafficSource(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source')?.toLowerCase();
  const referrer = (document.referrer || '').toLowerCase();

  if (utmSource) {
    if (utmSource.includes('google')) return 'google';
    if (utmSource.includes('instagram') || utmSource.includes('ig')) return 'instagram';
    if (utmSource.includes('facebook') || utmSource.includes('fb')) return 'facebook';
    if (utmSource.includes('whatsapp') || utmSource.includes('wa')) return 'whatsapp';
    return 'other';
  }

  if (!referrer) return 'direct';

  if (referrer.includes('google.com')) return 'google';
  if (referrer.includes('instagram.com')) return 'instagram';
  if (referrer.includes('facebook.com') || referrer.includes('fb.com')) return 'facebook';
  if (referrer.includes('whatsapp.com') || referrer.includes('wa.me')) return 'whatsapp';
  if (referrer.includes('t.co') || referrer.includes('twitter.com')) return 'twitter';
  if (referrer.includes('linkedin.com')) return 'linkedin';

  const currentDomain = window.location.hostname;
  if (!referrer.includes(currentDomain)) return 'other';

  return 'direct';
}

export function getUtmParams() {
  const urlParams = new URLSearchParams(window.location.search);

  return {
    utm_source: urlParams.get('utm_source') || null,
    utm_medium: urlParams.get('utm_medium') || null,
    utm_campaign: urlParams.get('utm_campaign') || null,
  };
}

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

/**
 * Geolocalização via IP:
 * - timeout curto (1.2s)
 * - se offline, não tenta
 * - nunca quebra fluxo
 */
export async function getGeolocation(): Promise<{ city: string | null; country: string | null }> {
  // 0) Se offline, nem tenta
  if (!navigator.onLine) return { city: null, country: null };

  // 1) Evitar Codespaces Preview / github.dev (CORS e manifest proxy costumam quebrar)
  const host = (window.location?.hostname || '').toLowerCase();
  const isCodespaces =
    host.endsWith('.app.github.dev') ||
    host.endsWith('.github.dev') ||
    host === 'github.dev';

  if (isCodespaces) return { city: null, country: null };

  // 2) (Opcional) Evitar PWA standalone (iOS/Edge às vezes bloqueia storage/requests e polui logs)
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    // @ts-ignore - iOS Safari legacy
    window.navigator?.standalone === true;

  if (isStandalone) return { city: null, country: null };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
    });

    if (!response.ok) return { city: null, country: null };
    const data = await response.json();

    return {
      city: data.city || null,
      country: data.country_name || null,
    };
  } catch {
    return { city: null, country: null };
  } finally {
    clearTimeout(timeout);
  }
}


// ============================================
// SESSION TRACKING
// ============================================

let sessionStartTime: number | null = null;
let durationUpdateInterval: any | null = null;

export async function trackSessionStart(): Promise<boolean> {
  try {
    if (!shouldRunAnalytics()) return false;

    if (safeGet(sessionStorage, SESSION_STARTED_KEY) === 'true') return true;

    const sessionId = getSessionId();
    const visitorId = getOrCreateVisitorId();
    const sourceType = detectTrafficSource();
    const utmParams = getUtmParams();
    const deviceType = getDeviceType();
    const browser = getBrowser();
    const isBotUser = isBot();

    const location = await getGeolocation();

    // 1) Inserir sessão
    const { error: sessionError } = await supabase.from('analytics_sessions').insert({
      session_id: sessionId,
      visitor_id: visitorId,
      first_visit: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      page_count: 1,
      duration_seconds: 0,
      is_bot: isBotUser,
      device_type: deviceType,
      browser,
      city: location.city,
      country: location.country,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      page_entry: window.location.pathname,
    });

    if (sessionError && !isConflictError(sessionError)) {
      handleAnalyticsError('Erro ao inserir sessão', sessionError);
    }

    // 2) Inserir origem
    const { error: sourceError } = await supabase.from('analytics_sources').insert({
      session_id: sessionId,
      source_type: sourceType,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      referrer: document.referrer || null,
    });

    if (sourceError && !isConflictError(sourceError)) {
      handleAnalyticsError('Erro ao inserir origem', sourceError);
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

let __heartbeatListenersAttached = false;

function startDurationHeartbeat() {
  if (durationUpdateInterval) clearInterval(durationUpdateInterval);

  durationUpdateInterval = setInterval(() => {
    if (!shouldRunAnalytics()) return;
    if (!navigator.onLine) return;
    if (document.visibilityState !== 'visible') return;
    void updateSessionDuration();
  }, HEARTBEAT_MS);

  // ✅ Evita anexar listeners múltiplas vezes (SPA)
  if (!__heartbeatListenersAttached) {
    __heartbeatListenersAttached = true;

    window.addEventListener('beforeunload', () => {
      void updateSessionDuration();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        void updateSessionDuration();
      }
    });
  }
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

// ============================================
// PAGE VIEW TRACKING
// ============================================

const trackedPages = new Set<string>();

export async function trackPageView(path: string, title: string): Promise<boolean> {
  try {
    if (!shouldRunAnalytics()) return false;
    if (!navigator.onLine) return false;
    if (document.visibilityState !== 'visible') return false;

    // ✅ Não tenta rastrear se não houver sessão
    // (evita chamadas supabase durante login / sem auth)
    const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) {
      handleAnalyticsError('Erro ao obter sessão (pageview)', sessErr);
      return false;
    }
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

    // RPC opcional — se não existir, vai falhar, mas não derruba e não spamma
    const { error: updateError } = await supabase.rpc('increment_page_count', {
      p_session_id: sessionId,
    });

    if (updateError && !isConflictError(updateError)) {
      if (isNetworkError(updateError)) disableAnalyticsForMinutes(DISABLE_ON_NETWORK_MINUTES);
      logOncePer10s('[ANALYTICS] increment_page_count falhou (ok ignorar):', updateError);
    }

    return true;
  } catch (error) {
    handleAnalyticsError('Erro ao rastrear pageview (catch)', error);
    return false;
  }
}

// ============================================
// EVENT TRACKING
// ============================================

const trackedEvents = new Set<string>();

export async function trackEvent(eventType: string, eventLabel?: string, pagePath?: string): Promise<boolean> {
  try {
    if (!shouldRunAnalytics()) return false;
    if (!navigator.onLine) return false;
    if (document.visibilityState !== 'visible') return false;

    // ✅ opcional: não rastreia sem sessão
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
      page_path: pagePath || window.location.pathname,
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

// ============================================
// CLICK TRACKING (não duplica listener)
// ============================================

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
    } else if (
      href.startsWith('tel:') ||
      dataEvent === 'phone_click' ||
      allText.includes('ligar') ||
      allText.includes('telefone') ||
      allText.includes('phone')
    ) {
      void trackEvent('phone_click', 'Phone Contact');
    } else if (
      href.startsWith('mailto:') ||
      dataEvent === 'email_click' ||
      allText.includes('email') ||
      allText.includes('e-mail')
    ) {
      void trackEvent('email_click', 'Email Contact');
    } else if (
      href.includes('instagram.com') ||
      href.includes('instagr.am') ||
      dataEvent === 'instagram_click' ||
      allText.includes('instagram') ||
      allText.includes('insta')
    ) {
      void trackEvent('instagram_click', 'Instagram Profile');
    } else if (
      href.includes('facebook.com') ||
      href.includes('fb.com') ||
      dataEvent === 'facebook_click' ||
      allText.includes('facebook')
    ) {
      void trackEvent('facebook_click', 'Facebook Profile');
    } else if (
      dataEvent === 'budget_click' ||
      allText.includes('orçamento') ||
      allText.includes('orcamento') ||
      allText.includes('solicitar') ||
      allText.includes('agendar') ||
      allText.includes('consulta') ||
      allText.includes('budget') ||
      allText.includes('quote')
    ) {
      void trackEvent('budget_click', 'Budget Request');
    } else if (
      href.includes('/login') ||
      href.includes('/client') ||
      allText.includes('login') ||
      allText.includes('entrar') ||
      allText.includes('área do cliente') ||
      allText.includes('minha conta')
    ) {
      void trackEvent('login_click', 'Login Access');
    }
  });
}
