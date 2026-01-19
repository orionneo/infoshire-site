/**
 * Utilitário para verificar conectividade de rede e status do Supabase
 * - Não depende de tabela "profiles" (pode falhar por RLS e dar falso "offline")
 * - Trata 401/403 como "conectado" (apenas sem permissão)
 * - Faz cache curto para evitar floods
 */

import { supabase } from '@/db/supabase';

type CheckResult = {
  success: boolean;
  message: string;
  latency?: number;
};

let lastCheckAt = 0;
let lastResult: CheckResult | null = null;

// Ajuste fino: evita rodar check toda hora
const CACHE_MS = 12_000; // 12s

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Heurística para decidir se um erro parece ser "rede" vs "permissão".
 */
function isLikelyNetworkError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('net::') ||
    msg.includes('dns') ||
    msg.includes('cors')
  );
}

/**
 * Check de conectividade com Supabase.
 * Estratégia:
 * 1) Se offline => falha
 * 2) auth.getSession() => ping leve (não depende de RLS)
 * 3) select leve em uma tabela que existe no seu schema (site_settings ou system_settings)
 *    - Se der 401/403 => considerar conectado (RLS bloqueou, mas Supabase respondeu)
 */
export async function checkSupabaseConnection(): Promise<CheckResult> {
  if (!isOnline()) {
    return { success: false, message: 'Sem conexão com a internet' };
  }

  const now = Date.now();
  if (lastResult && now - lastCheckAt < CACHE_MS) {
    return lastResult;
  }

  const startTime = performance.now();

  try {
    // 1) Ping leve via auth (não exige acesso a tabelas)
    await supabase.auth.getSession();

    // 2) Ping leve no banco (tabela "site_settings" ou "system_settings")
    //    Escolhi "system_settings" pois você listou ela como existente.
    //    Se você preferir "site_settings", pode trocar abaixo.
    const { error } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1);

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (error) {
      // Se for erro de permissão, é sinal de que o backend respondeu => conexão OK
      // Supabase normalmente retorna code como '42501' (insufficient_privilege) ou status 401/403 no REST.
      const status = (error as any)?.status;
      const code = (error as any)?.code;

      if (status === 401 || status === 403 || code === '42501') {
        const result = {
          success: true,
          message: 'Conectado (acesso restrito por permissão)',
          latency,
        };
        lastCheckAt = now;
        lastResult = result;
        return result;
      }

      const result = {
        success: false,
        message: `Erro ao consultar Supabase: ${error.message}`,
        latency,
      };
      lastCheckAt = now;
      lastResult = result;
      return result;
    }

    const result = {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      latency,
    };
    lastCheckAt = now;
    lastResult = result;
    return result;
  } catch (err: any) {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    // Se parece rede, marcar como falha de conexão
    if (isLikelyNetworkError(err)) {
      const result = {
        success: false,
        message: 'Falha de rede ao acessar o servidor',
        latency,
      };
      lastCheckAt = now;
      lastResult = result;
      return result;
    }

    // Caso genérico
    const result = {
      success: false,
      message: err instanceof Error ? err.message : 'Erro desconhecido',
      latency,
    };
    lastCheckAt = now;
    lastResult = result;
    return result;
  }
}

/**
 * Monitora mudanças no status da conexão
 */
export function setupNetworkMonitoring(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('✅ Conexão restaurada');
    onOnline?.();
  };

  const handleOffline = () => {
    console.warn('⚠️ Conexão perdida');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Retry automático para requisições que falharam
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido');

      if (attempt < maxRetries) {
        console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente em ${delayMs * attempt}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Falha após múltiplas tentativas');
}
