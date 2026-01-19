/**
 * Utilitário para verificar conectividade e status do Supabase
 * - Evita usar tabela sensível (profiles) para "ping"
 * - Usa RPC public.ping() (rápido, estável, e controlado)
 */

import { supabase } from '@/db/supabase';

export function isOnline(): boolean {
  return navigator.onLine;
}

type CheckResult = {
  success: boolean;
  message: string;
  latency?: number;
  code?: string;
};

function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  // supabase-js aceita AbortSignal via { signal } em rpc/select etc.
  // vamos embrulhar “na mão” aqui
  return new Promise<T>((resolve, reject) => {
    promise
      .then((v) => resolve(v))
      .catch((e) => reject(e))
      .finally(() => clearTimeout(timer));

    controller.signal.addEventListener('abort', () => {
      reject(new Error('timeout'));
    });
  });
}

export async function checkSupabaseConnection(): Promise<CheckResult> {
  if (!isOnline()) {
    return { success: false, message: 'Sem conexão com a internet' };
  }

  const start = performance.now();

  try {
    // Ping via RPC (não depende de RLS de tabelas)
    const { data, error } = await withTimeout(
      supabase.rpc('ping'),
      6000
    );

    const latency = Math.round(performance.now() - start);

    if (error) {
      return {
        success: false,
        message: `Supabase respondeu com erro: ${error.message}`,
        latency,
        code: error.code ?? undefined,
      };
    }

    if (!data?.ok) {
      return { success: false, message: 'Ping retornou resposta inesperada', latency };
    }

    return { success: true, message: 'Conexão OK', latency };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);

    // Classifica melhor os erros (sem ficar “tudo timeout”)
    const msg =
      err?.message === 'timeout'
        ? 'Timeout ao verificar Supabase (possível bloqueio/caching/SW).'
        : (err?.message || 'Erro desconhecido');

    return { success: false, message: msg, latency };
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

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
