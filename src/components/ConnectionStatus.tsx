// src/components/ConnectionStatus.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ✅ Indicator-only: não pinga Supabase, não roda "check".
// Mostra:
// - Offline do navegador
// - (Opcional) pendências na fila offline (se existir util)
// - Botão para "tentar sincronizar" (chama processOfflineQueue, sem bloquear UI)

type Props = {
  enabled?: boolean;
  showPending?: boolean; // se true, tenta mostrar contador de pendências
};

export function ConnectionStatus({ enabled = true, showPending = true }: Props) {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pending, setPending] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  const hasIssues = useMemo(() => {
    // só mostra se offline ou se tem pendências (opcional)
    if (!enabled) return false;
    if (!isOnline) return true;
    if (showPending && pending > 0) return true;
    return false;
  }, [enabled, isOnline, showPending, pending]);

  const refreshPendingBestEffort = async () => {
    if (!showPending) return;

    try {
      // ✅ tenta ler tamanho da fila offline, sem depender de rede.
      // Se não existir essa função no seu projeto, ele cai no catch e fica só "offline".
      const mod = await import('@/utils/offlineQueue');
      if (typeof mod.getAllTasks === 'function') {
        const tasks = await mod.getAllTasks();
        setPending(Array.isArray(tasks) ? tasks.length : 0);
      }
    } catch {
      // sem fila disponível? ok, não exibe pendências
      setPending(0);
    }
  };

  const trySync = async () => {
    // ✅ Nunca bloqueia nada: só tenta drenar fila
    setSyncing(true);
    try {
      const mod = await import('@/utils/processOfflineQueue');
      if (typeof mod.processOfflineQueue === 'function') {
        await mod.processOfflineQueue();
      }
    } catch (e) {
      // indicador não precisa “gritar”; falhou = continua pendente
      console.warn('Falha ao tentar sincronizar:', e);
    } finally {
      setSyncing(false);
      void refreshPendingBestEffort();
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const onOnline = () => {
      setIsOnline(true);
      void refreshPendingBestEffort();
      // tenta sync automaticamente ao voltar online (não bloqueia UI)
      void trySync();
    };

    const onOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // atualiza pendências ao montar + quando voltar visível
    void refreshPendingBestEffort();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshPendingBestEffort();
        // se voltou visível e está online, tenta sync
        if (navigator.onLine) void trySync();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // opcional: checar pendências de tempos em tempos, local-only (leve)
    timerRef.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshPendingBestEffort();
    }, 30_000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, showPending]);

  if (!enabled) return null;

  // ✅ Se não há problema, não renderiza nada
  if (!hasIssues) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sem conexão</AlertTitle>
          <AlertDescription>
            Você está offline. As ações continuam funcionando e serão sincronizadas quando a internet voltar.
          </AlertDescription>
        </Alert>
      )}

      {isOnline && showPending && pending > 0 && (
        <Alert className="shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pendências para sincronizar</AlertTitle>
          <AlertDescription className="space-y-2">
            <div>
              Existem <b>{pending}</b> ação(ões) aguardando envio. O sistema sincroniza automaticamente quando possível.
            </div>
            <button
              onClick={() => void trySync()}
              disabled={syncing}
              className="inline-flex items-center gap-2 text-sm underline hover:no-underline disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando…' : 'Sincronizar agora'}
            </button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
