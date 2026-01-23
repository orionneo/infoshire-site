/**
 * debugLogger.ts
 * Telemetria estruturada para debugging de operações offline-first
 * Logs em console (DEV) e persistidos em Supabase
 */

import { supabase } from '@/db/supabase';

export interface DebugEvent {
  id?: string;
  created_at?: string;
  user_id?: string;
  op_id?: string;
  event_type: string;
  message?: string;
  data?: Record<string, any>;
}

const DEBUG_TABLE = 'ai_errors'; // Fallback: usar tabela existente
const isDevMode = import.meta.env.DEV;

/**
 * Registra evento de debug
 * Em DEV: console.info
 * Em produção: persiste em Supabase (se admin)
 */
export async function logDebug(
  eventType: string,
  data?: Record<string, any>,
  message?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    data,
    message,
  };

  // 1. Log em console (DEV)
  if (isDevMode) {
    console.info(`[DEBUG] ${eventType}`, logEntry);
  }

  // 2. Persiste em Supabase (best-effort, não bloqueia)
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) return; // Sem sessão, skip

    // Usar ai_errors como fallback
    const event: DebugEvent = {
      op_id: data?.opId,
      event_type: eventType,
      message: message || data?.order_number,
      data: {
        timestamp,
        ...data,
      },
    };

    // Insert em ai_errors (não bloqueia, fire-and-forget)
    try {
      await supabase
        .from(DEBUG_TABLE)
        .insert([event]);
    } catch (insertErr: any) {
      if (isDevMode) console.warn(`[DebugLogger] Failed to persist:`, insertErr);
    }
  } catch (error) {
    if (isDevMode) console.warn(`[DebugLogger] Error:`, error);
  }
}

/**
 * Busca últimos N eventos de debug
 * Para exibir no painel admin
 */
export async function getDebugEvents(limit = 100): Promise<DebugEvent[]> {
  try {
    const { data, error } = await supabase
      .from(DEBUG_TABLE)
      .select('*')
      .eq('event_type', 'debug')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[DebugLogger] Failed to fetch events:', error);
    return [];
  }
}

/**
 * Busca eventos de uma operação específica
 */
export async function getOpDebugTimeline(opId: string): Promise<DebugEvent[]> {
  try {
    const { data, error } = await supabase
      .from(DEBUG_TABLE)
      .select('*')
      .eq('op_id', opId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[DebugLogger] Failed to fetch timeline:', error);
    return [];
  }
}
