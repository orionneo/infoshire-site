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

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<StatusState>({
    checking: true,
    success: true,
    message: '',
  });

  const inFlight = useRef(false);

  const checkConnection = async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    // Mostra "checking" mas com “escape hatch” (se der ruim, sai)
    setConnectionStatus((prev) => ({ ...prev, checking: true, message: '' }));

    try {
      const result = await checkSupabaseConnection();
      setConnectionStatus({
        checking: false,
        success: result.success,
        message: result.message,
        latency: result.latency,
      });
    } catch (e: any) {
      setConnectionStatus({
        checking: false,
        success: false,
        message: e?.message || 'Falha ao conectar',
      });
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    // check inicial
    checkConnection();

    // monitora online/offline do browser
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

    // re-check periódico (30s)
    const interval = setInterval(() => {
      if (navigator.onLine) checkConnection();
    }, 30000);

    // re-check quando volta o foco na aba (muito importante quando sai do /admin)
    const onFocus = () => {
      if (navigator.onLine) checkConnection();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cleanup();
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Se tudo OK e não está checando, não mostra nada
  if (isOnline && connectionStatus.success && !connectionStatus.checking) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sem conexão</AlertTitle>
          <AlertDescription>Você está offline. Verifique sua conexão com a internet.</AlertDescription>
        </Alert>
      )}

      {isOnline && !connectionStatus.success && !connectionStatus.checking && (
        <Alert variant="destructive" className="shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de conexão</AlertTitle>
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
          <AlertTitle>Verificando conexão...</AlertTitle>
          <AlertDescription>Aguarde enquanto verificamos a conexão com o servidor.</AlertDescription>
        </Alert>
      )}

      {isOnline && connectionStatus.success && connectionStatus.latency && connectionStatus.latency > 3000 && (
        <Alert className="shadow-lg border-yellow-500">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Conexão lenta</AlertTitle>
          <AlertDescription>A conexão está lenta ({connectionStatus.latency}ms). Algumas operações podem demorar mais.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
