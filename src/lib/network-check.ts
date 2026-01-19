/**
 * Utilitário para verificar conectividade de rede e status do Supabase
 */

import { supabase } from '@/db/supabase';

/**
 * Verifica se há conexão com a internet
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Verifica a conectividade com o Supabase
 * ✅ NÃO usa tabela (profiles), porque RLS/permissão pode causar falso "offline"
 * ✅ Usa ping leve: supabase.auth.getSession()
 * ✅ Tem timeout pra não ficar preso no "verificando conexão..."
 */
export async function checkSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  latency?: number;
}> {
  if (!isOnline()) {
    return {
      success: false,
      message: 'Sem conexão com a internet',
    };
  }

  const startTime = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    // "Ping" leve e confiável (não depende de RLS/tabelas)
    await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('timeout')));
      }),
    ]);

    const latency = Math.round(performance.now() - startTime);

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      latency,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);

    // Timeout / erro de fetch / etc.
    const msg =
      err?.message === 'timeout'
        ? 'Timeout ao conectar no servidor'
        : err instanceof Error
          ? err.message
          : 'Erro desconhecido';

    console.error('❌ Erro ao conectar com Supabase:', err);

    return {
      success: false,
      message: msg,
      latency,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Monitora mudanças no status da conexão
 */
export function setupNetworkMonitoring(onOnline?: () => void, onOffline?: () => void): () => void {
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

  // Retorna função de cleanup
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Retry automático para requisições que falharam
 */
export async function retryRequest<T>(requestFn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
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
