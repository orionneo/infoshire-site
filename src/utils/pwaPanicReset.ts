import { supabase } from '@/db/supabase';

type PanicOptions = {
  // por padrão, tenta limpar tudo
  clearSupabaseSession?: boolean; // true
  clearCaches?: boolean; // true
  clearStorage?: boolean; // true
  clearIndexedDb?: boolean; // true
  unregisterServiceWorkers?: boolean; // true
  // rota final (hash) pra voltar
  returnToHash?: string; // '#/login'
};

function isSecureContextForSW() {
  // SW exige https ou localhost
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  if (!isSecureContextForSW()) return;

  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(regs.map((r) => r.unregister()));
}

async function clearAllCaches() {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.allSettled(keys.map((k) => caches.delete(k)));
}

function clearWebStorage() {
  try {
    localStorage.clear();
  } catch {}
  try {
    sessionStorage.clear();
  } catch {}
}

async function clearAllIndexedDB() {
  // iOS/Safari pode não suportar indexedDB.databases()
  try {
    const anyIDB: any = indexedDB as any;
    if (typeof anyIDB.databases === 'function') {
      const dbs = await anyIDB.databases();
      if (Array.isArray(dbs)) {
        await Promise.allSettled(
          dbs
            .map((d: any) => d?.name)
            .filter(Boolean)
            .map((name: string) => {
              return new Promise<void>((resolve) => {
                const req = indexedDB.deleteDatabase(name);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              });
            })
        );
      }
    }
  } catch {
    // fallback: não faz nada (melhor do que quebrar UI)
  }
}

function hardReloadWithBust(returnToHash: string) {
  // Mantém origin + pathname, força hash pro login e adiciona bust
  const base = `${window.location.origin}${window.location.pathname}`;
  const bust = `__panic=${Date.now()}`;
  const hash = returnToHash.startsWith('#') ? returnToHash : `#${returnToHash}`;
  const nextUrl = `${base}${hash}${hash.includes('?') ? '&' : '?'}${bust}`;

  // replace evita ficar voltando pro estado quebrado no back
  window.location.replace(nextUrl);
}

export async function pwaPanicReset(opts: PanicOptions = {}) {
  const {
    clearSupabaseSession = true,
    clearCaches = true,
    clearStorage = true,
    clearIndexedDb = true,
    unregisterServiceWorkers = true,
    returnToHash = '#/login',
  } = opts;

  // UX: se quiser, você pode mostrar um toast/modal antes de rodar isso.
  // Aqui a gente só executa o “reset” e recarrega.

  // 1) Desloga Supabase (para token antigo não “reviver”)
  if (clearSupabaseSession) {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {}
  }

  // 2) Para “matar” a origem do cache: SW + caches
  if (unregisterServiceWorkers) {
    try {
      await unregisterAllServiceWorkers();
    } catch {}
  }

  if (clearCaches) {
    try {
      await clearAllCaches();
    } catch {}
  }

  // 3) Limpa storages
  if (clearStorage) {
    clearWebStorage();
  }

  if (clearIndexedDb) {
    try {
      await clearAllIndexedDB();
    } catch {}
  }

  // 4) Reload com cache-bust e volta pro login
  hardReloadWithBust(returnToHash);
}

// Útil pra só aparecer no PWA instalado
export function isRunningStandalonePWA() {
  // iOS Safari:
  const iosStandalone = (window.navigator as any).standalone === true;
  // Outros:
  const displayModeStandalone =
    window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

  return iosStandalone || displayModeStandalone;
}