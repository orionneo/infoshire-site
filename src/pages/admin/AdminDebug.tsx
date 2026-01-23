/**
 * AdminDebug.tsx
 * Painel de diagnóstico para admin visualizar fila de operações e eventos de debug
 * Útil para troubleshooting de criação de OS offline-first
 */

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getPendingOpsDB, PendingOp } from '@/services/pendingOps';
import { processPendingQueue } from '@/services/queueProcessor';
import { logAiEvent, getDebugEvents, getOpDebugTimeline } from '@/services/debugLogger';
import type { DebugEvent } from '@/services/debugLogger';

type ExpandedOp = Record<string, boolean>;

function AdminDebugPage() {
  const { toast } = useToast();
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const [expandedOps, setExpandedOps] = useState<ExpandedOp>({});
  const [opTimelines, setOpTimelines] = useState<Record<string, DebugEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      const db = await getPendingOpsDB();
      const ops = await db.getAll();
      setPendingOps(ops);

      const events = await getDebugEvents(50);
      setDebugEvents(events);

      // Carregar timeline de cada op
      const timelines: Record<string, DebugEvent[]> = {};
      for (const op of ops) {
        const timeline = await getOpDebugTimeline(op.opId);
        timelines[op.opId] = timeline;
      }
      setOpTimelines(timelines);
    } catch (err) {
      console.error('Erro ao carregar dados de debug:', err);
      toast({
        title: 'Erro ao carregar debug',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Auto-refresh a cada 2s
  useEffect(() => {
    loadData();

    if (!autoRefresh) return;

    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [loadData, autoRefresh]);

  const handleForceProcess = async () => {
    try {
      await logAiEvent('AdminDebug', 'force_process_start', { timestamp: Date.now() });
      toast({
        title: 'Processando fila',
        description: 'Tentando enviar todas as operações pendentes...',
      });
      await processPendingQueue({ reason: 'user_click' });
      await loadData();
      toast({
        title: 'Fila processada',
        description: 'Verifique os resultados abaixo.',
      });
    } catch (err) {
      console.error('Erro ao processar fila:', err);
      toast({
        title: 'Erro ao processar',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  const handleClearPending = async () => {
    if (!confirm('Tem certeza? Isto vai limpar TODAS as operações pendentes!')) return;

    try {
      const db = await getPendingOpsDB();
      await db.clear();
      await loadData();
      await logAiEvent('AdminDebug', 'clear_all_pending', { timestamp: Date.now() });
      toast({
        title: 'Fila limpa',
        description: 'Todas as operações foram removidas.',
      });
    } catch (err) {
      console.error('Erro ao limpar:', err);
      toast({
        title: 'Erro ao limpar',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOp = async (opId: string) => {
    try {
      const db = await getPendingOpsDB();
      await db.delete(opId);
      await logAiEvent('AdminDebug', 'delete_op', { opId, timestamp: Date.now() });
      await loadData();
      toast({
        title: 'Operação removida',
        description: `${opId}`,
      });
    } catch (err) {
      console.error('Erro ao deletar op:', err);
      toast({
        title: 'Erro ao deletar',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  const toggleOpExpand = (opId: string) => {
    setExpandedOps((prev) => ({
      ...prev,
      [opId]: !prev[opId],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'partial_done':
        return 'bg-yellow-50 border-yellow-200';
      case 'sending':
        return 'bg-blue-50 border-blue-200';
      case 'pending':
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
      sending: { label: 'Enviando', color: 'bg-blue-100 text-blue-800' },
      done: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      error: { label: 'Erro', color: 'bg-red-100 text-red-800' },
      partial_done: { label: 'Parcial', color: 'bg-yellow-100 text-yellow-800' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <p>Carregando dados de debug...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Debug - Fila Offline-First</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{pendingOps.length}</div>
              <p className="text-sm text-muted-foreground">Total de operações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600">
                {pendingOps.filter((op) => op.status === 'pending' || op.status === 'sending').length}
              </div>
              <p className="text-sm text-muted-foreground">Pendentes/Enviando</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {pendingOps.filter((op) => op.status === 'done' || op.status === 'partial_done').length}
              </div>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-600">
                {pendingOps.filter((op) => op.status === 'error').length}
              </div>
              <p className="text-sm text-muted-foreground">Erros</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleForceProcess}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Forçar Processamento
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearPending}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Tudo
          </Button>
        </div>

        {/* Pending Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Operações Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingOps.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma operação pendente</p>
            ) : (
              pendingOps.map((op) => (
                <div
                  key={op.opId}
                  className={`border rounded p-4 ${getStatusColor(op.status)}`}
                >
                  {/* Op Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleOpExpand(op.opId)}
                          className="p-1 hover:bg-white/50 rounded"
                        >
                          {expandedOps[op.opId] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <code className="text-xs">{op.opId}</code>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        OS: {op.order_number} | Tentativas: {op.attempts}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(op.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOp(op.opId)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Op Details (Expandable) */}
                  {expandedOps[op.opId] && (
                    <div className="text-xs space-y-2 mt-3 pt-3 border-t">
                      <div>
                        <strong>Criada:</strong>{' '}
                        {format(new Date(op.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </div>
                      {op.lastAttemptAt && (
                        <div>
                          <strong>Última tentativa:</strong>{' '}
                          {format(new Date(op.lastAttemptAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </div>
                      )}
                      {op.lastError && (
                        <div>
                          <strong>Último erro:</strong> {op.lastError}
                        </div>
                      )}
                      <div>
                        <strong>Payload:</strong>
                        <pre className="bg-white/50 p-2 rounded mt-1 overflow-auto max-h-40">
                          {JSON.stringify(op.payload, null, 2)}
                        </pre>
                      </div>

                      {/* Timeline de eventos */}
                      {opTimelines[op.opId] && opTimelines[op.opId].length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <strong>Timeline de Eventos:</strong>
                          <div className="space-y-1 mt-1">
                            {opTimelines[op.opId].map((event, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                {event.created_at && format(new Date(event.created_at), 'HH:mm:ss.SSS', { locale: ptBR })} -{' '}
                                <code>{event.event_type}</code>
                                {event.data && (
                                  <span className="ml-1">
                                    {JSON.stringify(event.data).slice(0, 100)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Debug Events Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline de Eventos (Últimos 50)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {debugEvents.length === 0 ? (
              <p className="text-muted-foreground">Nenhum evento registrado</p>
            ) : (
              debugEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="text-xs border-b pb-2 last:border-0 font-mono"
                >
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {event.created_at && format(new Date(event.created_at), 'dd/MM HH:mm:ss.SSS', { locale: ptBR })}
                    </span>
                    <code className="bg-gray-100 px-1 rounded">{event.event_type}</code>
                  </div>
                  {event.data && (
                    <div className="text-gray-600 mt-1">
                      {JSON.stringify(event.data).slice(0, 150)}
                    </div>
                  )}
                  {event.message && (
                    <div className="text-gray-500 mt-1">{event.message}</div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminDebugPage;
