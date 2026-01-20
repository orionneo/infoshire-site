/**
 * Utilitário para verificar conectividade e status do Supabase
 * Objetivos:
 * - NÃO poluir UI (quem decide mostrar algo é o ConnectionStatus)
 * - NÃO gerar falso negativo em PWA/mobile (background / iOS throttling)
 * - NÃO depender de tabela sensível (profiles) para ping
 * - Usar RPC public.ping() (rápido, controlado)
 *
 * Observação importante:
 * - supabase.rpc() retorna um "builder" (não é Promise). Então o timeout precisa
 *   envolver a execução do builder via .then() (await), usando um factory.
 */

import { supabase } from '@/db/supabase';

export function isOnline(): boolean {
  return navigator.onLine;
}

export function isBackground(): boolean {
  // PWA/mobile: quando a aba fica em background, iOS/Android podem pausar rede,
  // gerando timeouts falsos. Então evitamos checar nesse estado.
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

export type CheckResult = {
  success: boolean;
  message: string;
  latency?: number;
  code?: string;
};

/**
 * Timeout por Promise.race (compatível com qualquer Promise)
 * - "factory" garante que só criamos a promise quando vamos executar
 * - Não tenta abortar (porque o builder do supabase não é Promise abortável de forma estável via types)
 */
function withTimeout<T>(factory: () => Promise<T>, ms = 9000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error('timeout'));
    }, ms);

    factory()
      .then((v) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(e);
      });
  });
}

/**
 * Normaliza mensagens de erro para não ficar tudo "timeout"
 */
function normalizeError(err: any): { message: string; code?: string } {
  const code = err?.code ? String(err.code) : undefined;
  const msg = String(err?.message || err?.error_description || err?.details || '').toLowerCase();

  if (msg.includes('timeout')) {
    return { message: 'Timeout ao verificar Supabase (PWA/mobile pode pausar rede em background).', code };
  }

  // Erros comuns de rede
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('load failed') ||
    msg.includes('fetch') ||
    msg.includes('connection')
  ) {
    return { message: 'Falha de rede ao conectar no servidor.', code };
  }

  // fallback
  return { message: err?.message || 'Erro desconhecido', code };
}

/**
 * Verifica a conexão com Supabase via RPC ping()
 *
 * @param timeoutMs tempo máximo da tentativa
 * @param allowBackground se false, ignora checagem quando app estiver em background (recomendado)
 */
export async function checkSupabaseConnection(
  timeoutMs = 9000,
  allowBackground = false
): Promise<CheckResult> {
  if (!isOnline()) {
    return { success: false, message: 'Sem conexão com a internet' };
  }

  // Evita falso timeout em PWA/mobile
  if (!allowBackground && isBackground()) {
    return { success: true, message: 'Ignorado em background' };
  }

  const start = performance.now();

  try {
    // supabase.rpc retorna builder; o await transforma em Promise (executa)
    const { data, error } = await withTimeout(
      async () => {
        return await supabase.rpc('ping');
      },
      timeoutMs
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

    // Esperado: { ok: true }
    if (!data || (typeof data === 'object' && 'ok' in data && !(data as any).ok)) {
      return { success: false, message: 'Ping retornou resposta inesperada', latency };
    }

    return { success: true, message: 'Conexão OK', latency };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    const normalized = normalizeError(err);

    return {
      success: false,
      message: normalized.message,
      latency,
      code: normalized.code,
    };
  }
}

/**
 * Monitora mudanças no status da conexão do browser (online/offline)
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
