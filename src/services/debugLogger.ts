/**
 * debugLogger.ts - CORRECTED SCHEMA
 * Telemetria best-effort (nunca quebra fluxo, nunca POST 400)
 * Schema ai_errors: function_name, error_message, error_stack, input_snapshot, user_id, os_id
 */

import { supabase } from '@/db/supabase';

export interface DebugEvent {
  id?: string;
  created_at?: string;
  user_id?: string;
  function_name?: string;
  error_message: string;
  error_stack?: string;
  input_snapshot?: Record<string, any>;
}

type AiLogPayload = {
  function_name: string;
  error_message: string;
  error_stack?: string | null;
  input_snapshot?: any | null;
  user_id?: string | null;
  os_id?: string | null;
};

const isDevMode = import.meta.env.DEV;

/**
 * Log estruturado de evento (nunca quebra)
 * function_name: qual serviço/handler está logando
 * eventType: tipo de evento (ui_confirm_click, enqueue_start, send_success, etc)
 * snapshot: dados contextuais (opId, orderNumber, state, etc)
 */
export async function logAiEvent(
  functionName: string,
  eventType: string,
  snapshot?: any
): Promise<void> {
  if (isDevMode) {
    console.info(`[${functionName}] ${eventType}`, snapshot);
  }

  // Best-effort: tenta logar mas nunca quebra
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const payload: AiLogPayload = {
      function_name: functionName,
      error_message: eventType,
      input_snapshot: snapshot || {},
      user_id: userId || null,
      os_id: snapshot?.os_id || null,
    };

    // Fire-and-forget: não await, não trata erro
    supabase
      .from('ai_errors')
      .insert([payload])
      .catch((err) => {
        if (isDevMode) console.warn(`[${functionName}] Log failed (ignored):`, err.message);
      });
  } catch (error) {
    if (isDevMode) console.warn(`[${functionName}] Log error (ignored):`, error);
  }
}

/**
 * Log de erro (nunca quebra)
 * function_name: qual serviço está reportando erro
 * err: o erro (Error | unknown)
 * snapshot: contexto (opId, state, etc)
 */
export async function logAiError(
  functionName: string,
  err: unknown,
  snapshot?: any
): Promise<void> {
  const errorMsg = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;

  if (isDevMode) {
    console.error(`[${functionName}] Error:`, errorMsg, snapshot);
  }

  // Best-effort: tenta logar mas nunca quebra
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const payload: AiLogPayload = {
      function_name: functionName,
      error_message: errorMsg,
      error_stack: errorStack || null,
      input_snapshot: snapshot || {},
      user_id: userId || null,
      os_id: snapshot?.os_id || null,
    };

    // Fire-and-forget: não await, não trata erro
    supabase
      .from('ai_errors')
      .insert([payload])
      .catch((err) => {
        if (isDevMode) console.warn(`[${functionName}] Error log failed (ignored):`, err.message);
      });
  } catch (error) {
    if (isDevMode) console.warn(`[${functionName}] Error log catch (ignored):`, error);
  }
}

// Backward compat: logDebug agora é alias para logAiEvent
export async function logDebug(eventType: string, data?: Record<string, any>): Promise<void> {
  await logAiEvent('AdminOrders', eventType, data);
}

/**
 * Busca últimos N eventos de debug (para painel admin)
 */
export async function getDebugEvents(limit = 100): Promise<DebugEvent[]> {
  try {
    const { data, error } = await supabase
      .from('ai_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as DebugEvent[];
  } catch (error) {
    console.error('[DebugLogger] Failed to fetch events:', error);
    return [];
  }
}

/**
 * Busca eventos de uma operação específica (timeline)
 */
export async function getOpDebugTimeline(opId: string): Promise<DebugEvent[]> {
  try {
    const { data, error } = await supabase
      .from('ai_errors')
      .select('*')
      .or(`input_snapshot->>opId.eq.${opId},input_snapshot->>op_id.eq.${opId}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as DebugEvent[];
  } catch (error) {
    console.error('[DebugLogger] Failed to fetch timeline:', error);
    return [];
  }
}
