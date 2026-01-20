// src/components/ConnectionStatus.tsx
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { checkSupabaseConnection, setupNetworkMonitoring } from '@/lib/network-check';

type StatusState = {
  checking: boolean;
  success: boolean;
  message: string;
  latency?: number;
};

type Props = {
  enabled?: boolean;
  // Só mostra erro depois de X falhas seguidas (evita “intermitência visual”)
  failThreshold?: number;
};

export function ConnectionStatus({ enabled = true, failThreshold = 3 }: Props) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<StatusState>({
    checking: true,
    success: true,
    message: '',
  });

  const inFlight = useRef(false);
  const failCount = useRef(0);
  const mounted = useRef(false);

  const checkConnection = async () => {
    if (!enabled) return;
    if (inFlight.current) return;

    // Em PWA/mobile, se estiver em background, não faz check (reduz falso timeout)
    if (document.visibilityState === 'hidden') return;

    inFlight.current = true;

    // Só mostra "checking" no primeiro load (evita flicker a cada recheck)
    if (!mounted.current) {
      setConnectionStatus((prev) => ({ ...prev, checking: true, message: '' }));
    }

    try {
      const result = await checkSupabaseConnection(9000, false);

      if (result.success) {
        failCount.current = 0;

        setConnectionStatus({
          checking: false,
          success: true,
          message: '',
          latency: result.latency,
        });
      } else {
        failCount.current += 1;

        // Só exibe erro depois de X falhas seguidas
        if (failCount.current >= failThreshold) {
          setConnectionStatus({
            checking: false,
            success: false,
            message: result.message,
            latency: result.latency,
          });
        } else {
          // mantém silencioso até atingir o threshold
          setConnectionStatus((prev) => ({
            ...prev,
            checking: false,
            success: true,
            message: '',
          }));
        }
      }
    } catch (e: any) {
      failCount.current += 1;

      if (failCount.current >= failThreshold) {
        setConnectionStatus({
          checking: false,
          success: false,
          message: e?.message || 'Falha ao conectar',
        });
      } else {
        setConnectionStatus((prev) => ({
          ...prev,
          checking: false,
          success: true,
          message: '',
        }));
      }
    } finally {
      mounted.current = true;
      inFlight.current = false;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // check inicial
    checkConnection();

    // online/offline
    const cleanup = setupNetworkMonitoring(
      () => {
        setIsOnline(true);
        checkConnection();
      },
      () => {
        setIsOnline(false);
        setConnectionStatus({
          checking: false,
          success: false,
          message: 'Sem conexão com a internet',
        });
      }
    );

    // Re-check quando volta foco/visível (sem interval, para evitar falso negativo)
    const onFocus = () => {
      if (navigator.onLine) checkConnection();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) checkConnection();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cleanup();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, failThreshold]);

  // ✅ Se desabilitado: não mostra nada
  if (!enabled) return null;

  // ✅ Se tudo OK, não mostra nada
  if (isOnline && connectionStatus.success && !connectionStatus.checking) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sem conexão</AlertTitle>
          <AlertDescription>Você está offline. Verifique sua internet.</AlertDescription>
        </Alert>
      )}

      {isOnline && !connectionStatus.success && !connectionStatus.checking && (
        <Alert variant="destructive" className="shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema de conexão</AlertTitle>
          <AlertDescription>
            {connectionStatus.message}
            <button onClick={checkConnection} className="mt-2 block text-sm underline hover:no-underline">
              Tentar novamente
            </button>
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus.checking && (
        <Alert className="shadow-lg">
          <Wifi className="h-4 w-4 animate-pulse" />
          <AlertTitle>Verificando…</AlertTitle>
          <AlertDescription>Validando acesso ao servidor.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
