// src/lib/analytics.ts
import { supabase } from '@/db/supabase';

// ============================================
// HELPERS
// ============================================

function safeUUID(): string {
  try {
    // browsers modernos
    return crypto.randomUUID();
  } catch {
    // fallback simples
    return `uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function isConflictError(err: any): boolean {
  // PostgrestError costuma vir com .code (23505) ou status 409 no fetch
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

// ============================================
// VISITOR & SESSION MANAGEMENT
// ============================================

export function getOrCreateVisitorId(): string {
  const VISITOR_KEY = 'analytics_visitor_id';

  let visitorId = localStorage.getItem(VISITOR_KEY);

  if (!visitorId) {
    visitorId = safeUUID();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  return visitorId;
}

export function getSessionId(): string {
  const SESSION_KEY = 'analytics_session_id';

  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = safeUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
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
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent))
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
 * Geolocalização via IP (com timeout, para não travar o app)
 */
export async function getGeolocation(): Promise<{ city: string | null; country: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('[ANALYTICS] Erro ao buscar geolocalização:', response.status);
      return { city: null, country: null };
    }

    const data = await response.json();

    return {
      city: data.city || null,
      country: data.country_name || null,
    };
  } catch (error) {
    // timeout/offline/etc.
    console.error('[ANALYTICS] Erro ao buscar geolocalização:', error);
    return { city: null, country: null };
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================
// SESSION TRACKING
// ============================================

let sessionStartTime: number | null = null;
let lastActivityTime: number | null = null;
let durationUpdateInterval: any | null = null;

export async function trackSessionStart(): Promise<boolean> {
  try {
    const SESSION_STARTED_KEY = 'analytics_session_started';
    if (sessionStorage.getItem(SESSION_STARTED_KEY) === 'true') return true;

    const sessionId = getSessionId();
    const visitorId = getOrCreateVisitorId();
    const sourceType = detectTrafficSource();
    const utmParams = getUtmParams();
    const deviceType = getDeviceType();
    const browser = getBrowser();
    const isBotUser = isBot();

    // Geolocalização NÃO pode travar o fluxo
    const location = await getGeolocation();

    // 1) Inserir sessão (se der conflito, consideramos OK)
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
      console.error('[ANALYTICS] Erro ao inserir sessão:', sessionError);
      // não derruba app
    }

    // 2) Inserir origem (erro aqui também não derruba)
    const { error: sourceError } = await supabase.from('analytics_sources').insert({
      session_id: sessionId,
      source_type: sourceType,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      referrer: document.referrer || null,
    });

    if (sourceError && !isConflictError(sourceError)) {
      console.error('[ANALYTICS] Erro ao inserir origem:', sourceError);
    }

    sessionStorage.setItem(SESSION_STARTED_KEY, 'true');
    sessionStartTime = Date.now();
    lastActivityTime = Date.now();

    startDurationHeartbeat();
    return true;
  } catch (error) {
    console.error('[ANALYTICS] Erro ao iniciar sessão:', error);
    return false;
  }
}

function startDurationHeartbeat() {
  if (durationUpdateInterval) clearInterval(durationUpdateInterval);

  durationUpdateInterval = setInterval(() => {
    if (document.visibilityState === 'visible') updateSessionDuration();
  }, 5000);

  window.addEventListener('beforeunload', () => {
    updateSessionDuration();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastActivityTime = Date.now();
    } else {
      updateSessionDuration();
    }
  });
}

async function updateSessionDuration() {
  try {
    if (!sessionStartTime || !lastActivityTime) return;

    const sessionId = getSessionId();
    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    const { error } = await supabase
      .from('analytics_sessions')
      .update({
        duration_seconds: durationSeconds,
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (error && !isConflictError(error)) {
      console.error('[ANALYTICS] Erro ao atualizar duração:', error);
    }
  } catch (e) {
    console.error('[ANALYTICS] Erro ao atualizar duração (catch):', e);
  }
}

// ============================================
// PAGE VIEW TRACKING
// ============================================

const trackedPages = new Set<string>();

export async function trackPageView(path: string, title: string): Promise<boolean> {
  try {
    const sessionId = getSessionId();
    const visitorId = getOrCreateVisitorId();

    const pageKey = `${sessionId}-${path}`;
    if (trackedPages.has(pageKey)) return true;

    // Upsert pra evitar 409 (conflito/duplicado)
    const { error } = await supabase
      .from('analytics_pageviews')
      .upsert(
        {
          // Se sua tabela tiver "id" uuid, ótimo. Se não tiver, remove este campo.
          id: safeUUID(),
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

    if (error) {
      // conflito = ok
      if (!isConflictError(error)) {
        console.error('[ANALYTICS] Erro ao rastrear pageview:', error);
        return false;
      }
    }

    trackedPages.add(pageKey);

    // Increment page_count (se existir RPC). Se falhar, não derruba app.
    const { error: updateError } = await supabase.rpc('increment_page_count', {
      p_session_id: sessionId,
    });

    if (updateError && !isConflictError(updateError)) {
      console.error('[ANALYTICS] Erro ao incrementar page_count:', updateError);
    }

    return true;
  } catch (error) {
    console.error('[ANALYTICS] Erro ao rastrear pageview (catch):', error);
    return false;
  }
}

// ============================================
// EVENT TRACKING
// ============================================

const trackedEvents = new Set<string>();

export async function trackEvent(eventType: string, eventLabel?: string, pagePath?: string): Promise<boolean> {
  try {
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
      console.error('[ANALYTICS] Erro ao rastrear evento:', error);
      return false;
    }

    trackedEvents.add(eventKey);
    return true;
  } catch (error) {
    console.error('[ANALYTICS] Erro ao rastrear evento (catch):', error);
    return false;
  }
}

export function setupClickTracking() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const clickable = target.closest('a, button, [role="button"], [onclick]');
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
      trackEvent('whatsapp_click', 'WhatsApp Contact');
    } else if (href.startsWith('tel:') || dataEvent === 'phone_click' || allText.includes('ligar') || allText.includes('telefone') || allText.includes('phone')) {
      trackEvent('phone_click', 'Phone Contact');
    } else if (href.startsWith('mailto:') || dataEvent === 'email_click' || allText.includes('email') || allText.includes('e-mail')) {
      trackEvent('email_click', 'Email Contact');
    } else if (
      href.includes('instagram.com') ||
      href.includes('instagr.am') ||
      dataEvent === 'instagram_click' ||
      allText.includes('instagram') ||
      allText.includes('insta')
    ) {
      trackEvent('instagram_click', 'Instagram Profile');
    } else if (href.includes('facebook.com') || href.includes('fb.com') || dataEvent === 'facebook_click' || allText.includes('facebook')) {
      trackEvent('facebook_click', 'Facebook Profile');
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
      trackEvent('budget_click', 'Budget Request');
    } else if (
      href.includes('/login') ||
      href.includes('/client') ||
      allText.includes('login') ||
      allText.includes('entrar') ||
      allText.includes('área do cliente') ||
      allText.includes('minha conta')
    ) {
      trackEvent('login_click', 'Login Access');
    }
  });
}
