/**
 * Utilitário para verificar conectividade e status do Supabase
 * - Evita usar tabela sensível (profiles) para "ping"
 * - Usa RPC public.ping() (rápido, estável e controlado)
 *
 * Observação (TypeScript/Supabase):
 * - Em algumas versões, supabase.rpc() NÃO é tipado como Promise<T> diretamente.
 * - Para aplicar timeout via Promise.race, embrulhamos em Promise.resolve().then(() => supabase.rpc(...))
 */

import { supabase } from '@/db/supabase';

export function isOnline(): boolean {
  return navigator.onLine;
}

export type CheckResult = {
  success: boolean;
  message: string;
  latency?: number;
  code?: string;
};

function isBackground(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * Timeout via Promise.race (não depende de AbortSignal — mais compatível com supabase-js)
 */
function withTimeout<T>(factory: () => Promise<T>, ms = 9000): Promise<T> {
  let timer: number | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('timeout')), ms);
  });

  const runPromise = Promise.resolve().then(factory);

  return Promise.race([runPromise, timeoutPromise]).finally(() => {
    if (timer) window.clearTimeout(timer);
  }) as Promise<T>;
}

function normalizeError(err: any): { message: string; code?: string } {
  const code = err?.code ?? err?.status ?? undefined;
  const msg = String(err?.message || '');

  if (msg === 'timeout') {
    return { message: 'Timeout ao verificar servidor.', code: String(code ?? '') || undefined };
  }

  const lower = msg.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('net::err') ||
    lower.includes('fetch')
  ) {
    return { message: 'Falha de rede ao acessar o servidor.', code: String(code ?? '') || undefined };
  }

  if (lower.includes('cors') || lower.includes('blocked')) {
    return { message: 'Requisição bloqueada (CORS/bloqueio de rede).', code: String(code ?? '') || undefined };
  }

  return { message: msg || 'Erro desconhecido', code: String(code ?? '') || undefined };
}

/**
 * Checa a conectividade com o Supabase via RPC ping().
 *
 * @param timeoutMs Timeout (mobile pode precisar de mais)
 * @param allowBackground Se false, não checa quando app está em background (reduz falso negativo em PWA)
 */
export async function checkSupabaseConnection(
  timeoutMs = 9000,
  allowBackground = false
): Promise<CheckResult> {
  if (!isOnline()) {
    return { success: false, message: 'Sem conexão com a internet' };
  }

  // Em PWA/mobile, quando fica em background, pode atrasar e gerar falso timeout
  if (!allowBackground && isBackground()) {
    return { success: true, message: 'OK (background ignorado)' };
  }

  const start = performance.now();

  try {
    const { data, error } = await withTimeout(
      () => Promise.resolve().then(() => supabase.rpc('ping')),
      timeoutMs
    );

    const latency = Math.round(performance.now() - start);

    if (error) {
      return {
        success: false,
        message: `Supabase respondeu com erro: ${error.message}`,
        latency,
        code: (error as any).code ?? undefined,
      };
    }

    if (!(data as any)?.ok) {
      return { success: false, message: 'Ping retornou resposta inesperada', latency };
    }

    return { success: true, message: 'Conexão OK', latency };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    const normalized = normalizeError(err);
    return { success: false, message: normalized.message, latency, code: normalized.code };
  }
}

/**
 * Monitora mudanças no status da conexão
 */
export function setupNetworkMonitoring(onOnline?: () => void, onOffline?: () => void): () => void {
  const handleOnline = () => onOnline?.();
  const handleOffline = () => onOffline?.();

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Útil no PWA: ao voltar do background, revalida se estiver online
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) onOnline?.();
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}