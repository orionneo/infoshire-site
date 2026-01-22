// src/utils/autoSync.ts
import { supabase } from '@/db/supabase';

export type SyncStatus = {
  // legacy fields (o SyncStatusBadge espera isso)
  online: boolean;
  syncing: boolean;
  lastSyncAt: number | null;
  lastReason: string | null;

  // extras úteis
  lastOkAt: number | null;
  lastError: string | null;
};

type Listener = (s: SyncStatus) => void;
const listeners = new Set<Listener>();

const status: SyncStatus = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  lastSyncAt: null,
  lastReason: null,
  lastOkAt: null,
  lastError: null,
};

function emit() {
  const snap = { ...status };
  for (const fn of listeners) fn(snap);
}

export function getSyncStatus(): SyncStatus {
  return { ...status };
}

export function subscribeSyncStatus(fn: Listener): () => void {
  listeners.add(fn);
  fn({ ...status });
  return () => listeners.delete(fn);
}

// Ping simples (sem fila/offline)
export async function runAutoSync(reason: string = 'autoSync'): Promise<void> {
  status.online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  status.syncing = true;
  status.lastReason = reason;
  status.lastError = null;
  emit();
const isAdminRoute = () => {
  const h = window.location.hash || '';
  return h.startsWith('#/admin');
};

if (isAdminRoute()) return; // ✅ admin não faz autosync automático
  try {
    const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) throw sessErr;

    const session = sessionData?.session;
    if (!session) {
      // sem sessão => não adianta bater em REST; Badge mostra o motivo
      status.lastSyncAt = Date.now();
      status.syncing = false;
      status.lastError = `[${reason}] sem sessão (usuário deslogado)`;
      emit();
      return;
    }

    // “ping” barato: head select. Não precisa retornar dados.
    // (Se "profiles" não existir, isso falha e cai no catch; ok.)
    await supabase.from('profiles').select('id', { head: true }).limit(1);

    status.lastSyncAt = Date.now();
    status.lastOkAt = Date.now();
    status.syncing = false;
    emit();
  } catch (e: any) {
    status.lastSyncAt = Date.now();
    status.syncing = false;
    status.lastError = e?.message ?? String(e);
    emit();
  }
}

// compatibilidade com main.tsx
export function installAutoSyncListeners() {
  const onOnline = () => {
    status.online = true;
    emit();
    runAutoSync('online');
  };
  const onOffline = () => {
    status.online = false;
    emit();
  };
  const onVis = () => {
    if (document.visibilityState === 'visible') runAutoSync('visibility');
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVis);

  // boot
  runAutoSync('boot');

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVis);
  };
}
