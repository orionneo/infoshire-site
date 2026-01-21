import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSyncStatus, runAutoSync, subscribeSyncStatus } from '@/utils/autoSync';

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function SyncStatusBadge() {
  const [s, setS] = useState(getSyncStatus());

  useEffect(() => {
    return subscribeSyncStatus(setS);
  }, []);

  const last = s.lastSyncAt ? formatTime(s.lastSyncAt) : '—';

  // Tooltip (title) com detalhes
  const titleLines = [
    `Online: ${s.online ? 'sim' : 'não'}`,
    `Syncing: ${s.syncing ? 'sim' : 'não'}`,
    `Último sync: ${s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : '—'}`,
    s.lastReason ? `Motivo: ${s.lastReason}` : '',
    s.lastError ? `Erro: ${s.lastError}` : '',
    'Clique para forçar sync',
  ].filter(Boolean);

  const title = titleLines.join('\n');

  // UI/cores via variants do badge
  if (!s.online) {
    return (
      <button
        type="button"
        onClick={() => void runAutoSync('manual-click')}
        title={title}
        className="select-none"
      >
        <Badge variant="destructive" className="cursor-pointer">
          <WifiOff />
          Offline
        </Badge>
      </button>
    );
  }

  if (s.syncing) {
    return (
      <button
        type="button"
        onClick={() => void runAutoSync('manual-click')}
        title={title}
        className="select-none"
      >
        <Badge variant="secondary" className="cursor-pointer">
          <RefreshCw className="animate-spin" />
          Sincronizando…
        </Badge>
      </button>
    );
  }

  if (s.lastError) {
    return (
      <button
        type="button"
        onClick={() => void runAutoSync('manual-click')}
        title={title}
        className="select-none"
      >
        <Badge variant="destructive" className="cursor-pointer">
          <AlertTriangle />
          Erro · {last}
        </Badge>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void runAutoSync('manual-click')}
      title={title}
      className="select-none"
    >
      <Badge variant="outline" className="cursor-pointer">
        <Wifi />
        Online · {last}
        <CheckCircle2 className="opacity-70" />
      </Badge>
    </button>
  );
}
