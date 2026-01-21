import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Package } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientLayout } from '@/components/layouts/ClientLayout';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getClientServiceOrders } from '@/db/api';
import type { ServiceOrder } from '@/types/types';

type Bucket = 'open' | 'in_progress' | 'ready' | 'completed';

const bucketOf = (status: ServiceOrder['status']): Bucket => {
  if (['completed'].includes(status)) return 'completed';
  if (['ready_for_pickup'].includes(status)) return 'ready';
  if (['analyzing', 'awaiting_parts', 'awaiting_approval', 'approved', 'in_repair'].includes(status)) return 'in_progress';
  return 'open'; // received, not_approved etc cai aqui como “aberta”
};

const getProgress = (status: ServiceOrder['status']) => {
  // 0..100 (visual simples)
  switch (status) {
    case 'received':
      return 10;
    case 'analyzing':
      return 25;
    case 'awaiting_approval':
      return 35;
    case 'approved':
      return 45;
    case 'in_repair':
      return 65;
    case 'awaiting_parts':
      return 55;
    case 'ready_for_pickup':
      return 90;
    case 'completed':
      return 100;
    case 'not_approved':
      return 15;
    default:
      return 20;
  }
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const data = await getClientServiceOrders(user.id);
      // ✅ mais recentes primeiro
      const sorted = [...(data || [])].sort((a, b) => {
        const ad = new Date(a.created_at).getTime();
        const bd = new Date(b.created_at).getTime();
        return bd - ad;
      });
      setOrders(sorted);
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const counts = { open: 0, in_progress: 0, ready: 0, completed: 0 };
    for (const o of orders) {
      counts[bucketOf(o.status)] += 1;
    }
    return counts;
  }, [orders]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minhas Ordens de Serviço</h1>
          <p className="text-muted-foreground">Acompanhe o status dos seus reparos</p>
        </div>

        {/* ✅ Dashboard Visual (Resumo) */}
        {orders.length > 0 && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Abertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.open}</div>
                <div className="text-xs text-muted-foreground">Recebidas / aguardando</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Em andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.in_progress}</div>
                <div className="text-xs text-muted-foreground">Análise / reparo / peças</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Prontas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.ready}</div>
                <div className="text-xs text-muted-foreground">Aguardando retirada</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Finalizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completed}</div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </CardContent>
            </Card>
          </div>
        )}

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma ordem de serviço</p>
              <p className="text-sm text-muted-foreground text-center">
                Você ainda não possui ordens de serviço cadastradas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => {
              const progress = getProgress(order.status);
              const entryDate = order.entry_date ? formatDate(order.entry_date) : '-';

              return (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/client/orders/${order.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">OS #{order.order_number}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{order.equipment}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* ✅ Andamento visual simples */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Andamento</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="line-clamp-2">
                        <span className="text-muted-foreground">Problema: </span>
                        <span>{order.problem_description}</span>
                      </div>

                      {/* ✅ Data de entrada (pode ser retroativa) */}
                      <div>
                        <span className="text-muted-foreground">Entrada: </span>
                        <span>{entryDate}</span>
                      </div>

                      {/* ✅ Criado em (quando foi lançado no sistema) */}
                      <div>
                        <span className="text-muted-foreground">Registrado em: </span>
                        <span>{formatDateTime(order.created_at)}</span>
                      </div>

                      {order.estimated_completion && (
                        <div>
                          <span className="text-muted-foreground">Previsão: </span>
                          <span>{formatDate(order.estimated_completion)}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/client/orders/${order.id}`);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
