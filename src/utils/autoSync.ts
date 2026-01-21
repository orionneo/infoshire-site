import { processOfflineQueue } from '@/utils/processOfflineQueue';

export type SyncStatus = {
  online: boolean;
  syncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
  lastReason: string | null;
};

const status: SyncStatus = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  lastSyncAt: null,
  lastError: null,
  lastReason: null,
};

const listeners = new Set<(s: SyncStatus) => void>();

function emit() {
  const snapshot = { ...status };
  listeners.forEach((fn) => fn(snapshot));
}

export function getSyncStatus(): SyncStatus {
  return { ...status };
}

export function subscribeSyncStatus(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn);
  fn({ ...status }); // estado inicial
  return () => {
    // ✅ retorna void (não boolean), resolve seu erro do useEffect
    listeners.delete(fn);
  };
}

// throttle pra não disparar várias vezes ao voltar pro app
let running = false;
let lastRunAt = 0;
const MIN_INTERVAL_MS = 8000;

export async function runAutoSync(reason: string) {
  try {
    if (running) return;

    status.online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!status.online) {
      emit();
      return;
    }

    const now = Date.now();
    if (now - lastRunAt < MIN_INTERVAL_MS) return;

    running = true;
    lastRunAt = now;

    status.syncing = true;
    status.lastReason = reason;
    status.lastError = null;
    emit();

    console.info(`🔄 AutoSync: ${reason}`);

    // ✅ acorda sessão/refresh (iOS/PWA)
    try {
      const { wakeSupabase } = await import('@/db/supabase');
      await wakeSupabase(`autosync:${reason}`);
    } catch (e) {
      console.warn('⚠️ wakeSupabase falhou (segue):', e);
    }

    // ✅ processa fila offline
    await processOfflineQueue();

    status.lastSyncAt = Date.now();
    status.lastError = null;
  } catch (err: any) {
    status.lastError = err?.message ? String(err.message) : String(err);
    console.warn('⚠️ AutoSync falhou (segue normal):', err);
  } finally {
    status.syncing = false;
    emit();
    running = false;
  }
}

export function installAutoSyncListeners() {
  const updateOnline = () => {
    status.online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    emit();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      void runAutoSync('visibilitychange->visible');
    }
  };

  const onPageShow = (e: PageTransitionEvent) => {
    if ((e as any).persisted) {
      void runAutoSync('pageshow(bfcache)');
    } else {
      void runAutoSync('pageshow');
    }
  };

  const onOnline = () => {
    updateOnline();
    void runAutoSync('online');
  };

  const onOffline = () => {
    updateOnline();
  };

  const onFocus = () => void runAutoSync('focus');

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('focus', onFocus);

  updateOnline();
  void runAutoSync('startup');

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', onPageShow);
    window.removeEventListener('focus', onFocus);
  };
}
