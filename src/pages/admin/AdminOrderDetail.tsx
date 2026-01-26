import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Check, Edit, ExternalLink, Loader2, Trash2, Tag, Brain } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatBox } from '@/components/ChatBox';
import { DiagnosticAssistant } from '@/components/DiagnosticAssistant';
import { SolutionLearning } from '@/components/SolutionLearning';
import { IntelligentFlow } from '@/components/IntelligentFlow';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { OrderProgressTimeline } from '@/components/OrderProgressTimeline';
import { allStatuses, OrderStatusBadge } from '@/components/OrderStatusBadge';
import { OrderTimeline } from '@/components/OrderTimeline';
import { OrderImageGallery } from '@/components/orders/OrderImageGallery';
import WarrantyStatus from '@/components/WarrantyStatus';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/ui/voice-input';
import { useAuth } from '@/contexts/AuthContext';
import {
  createMessage,
  deleteServiceOrder,
  getOrderStatusHistory,
  getServiceOrder,
  getServiceOrderItems,
  getSystemSetting,
  updateServiceOrder,
  updateServiceOrderDiscount,
  updateServiceOrderStatus,
} from '@/db/api';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ApprovalHistory, OrderStatus, OrderStatusHistoryWithUser, ServiceOrderItem, ServiceOrderWithClient } from '@/types/types';

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // ✅ CRITICAL: obter authLoading
  const { toast } = useToast();

  const [order, setOrder] = useState<ServiceOrderWithClient | null>(null);
  const [history, setHistory] = useState<OrderStatusHistoryWithUser[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [additionalItems, setAdditionalItems] = useState<ServiceOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // ✅ NOVO: WhatsApp só abre por clique do usuário (PWA-safe)
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [whatsDialogOpen, setWhatsDialogOpen] = useState(false);
  const [whatsDialogTitle, setWhatsDialogTitle] = useState('Abrir WhatsApp');
  const [whatsDialogHint, setWhatsDialogHint] = useState('Clique no botão abaixo para abrir o WhatsApp e enviar a mensagem.');

  const editForm = useForm({
    defaultValues: {
      equipment: '',
      serial_number: '',
      problem_description: '',
      entry_date: '',
      estimated_completion: '',
      completed_at: '',
      status: '' as OrderStatus,
      notes: '',
      labor_cost: '',
      parts_cost: '',
      discount_amount: '',
      discount_reason: '',
    },
  });

  const statusForm = useForm({
    defaultValues: {
      status: '' as OrderStatus,
      notes: '',
      labor_cost: '',
      parts_cost: '',
      budget_notes: '',
    },
  });

  const discountForm = useForm({
    defaultValues: {
      discount_amount: '',
      discount_reason: '',
    },
  });

  const selectedStatus = statusForm.watch('status');

  // ✅ CRITICAL: SÓ carregar dados quando Auth estiver pronto
  useEffect(() => {
    if (authLoading) return; // Aguardar Auth terminar de carregar
    if (!user) return; // Sem usuário, não carregar
    if (!id) return;
    
    loadOrder();
    loadHistory();
    loadApprovalHistory();
    loadAdditionalItems();
  }, [authLoading, user, id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (order) {
      editForm.reset({
        equipment: order.equipment,
        serial_number: order.serial_number || '',
        problem_description: order.problem_description,
        entry_date: order.entry_date ? format(new Date(order.entry_date), 'yyyy-MM-dd') : '',
        estimated_completion: order.estimated_completion ? format(new Date(order.estimated_completion), 'yyyy-MM-dd') : '',
        completed_at: order.completed_at ? format(new Date(order.completed_at), 'yyyy-MM-dd') : '',
        status: order.status,
        notes: '',
        labor_cost: order.labor_cost ? order.labor_cost.toString() : '',
        parts_cost: order.parts_cost ? order.parts_cost.toString() : '',
        discount_amount: order.discount_amount ? order.discount_amount.toString() : '',
        discount_reason: order.discount_reason || '',
      });

      discountForm.reset({
        discount_amount: order.discount_amount ? order.discount_amount.toString() : '',
        discount_reason: order.discount_reason || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  // ✅ Função única pra abrir WA (apenas em clique)
  const handleOpenWhatsAppClick = () => {
    if (!whatsappUrl) return;

    try {
      // ✅ Sempre redirecionar na mesma aba (PWA-safe)
      window.location.assign(whatsappUrl);
    } catch (e) {
      console.error('Falha ao abrir WhatsApp:', e);
      toast({
        title: 'Não foi possível abrir o WhatsApp',
        description: 'Copie o link e tente abrir manualmente.',
        variant: 'destructive',
      });
    }
  };

  const loadOrder = async () => {
    if (!id) return;

    try {
      // ✅ SOFT TIMEOUT: Avisar ao usuário, mas NÃO matar o request
      let slowWarningShown = false;
      const slowWarningId = setTimeout(() => {
        slowWarningShown = true;
        toast({
          title: 'Carregando...',
          description: 'A requisição está demorando mais que o esperado. Aguarde...',
        });
      }, 8000);
      
      const data = await getServiceOrder(id);
      
      clearTimeout(slowWarningId); // ✅ Limpar timer
      
      setOrder(data);
    } catch (error) {
      console.error('Erro ao carregar ordem:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao carregar ordem',
        description: `Não foi possível carregar a ordem: ${errorMsg}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!id) return;

    try {
      const data = await getOrderStatusHistory(id);
      setHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadAdditionalItems = async () => {
    if (!id) return;

    try {
      const data = await getServiceOrderItems(id);
      setAdditionalItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens adicionais:', error);
    }
  };

  const loadApprovalHistory = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase.from('approval_history').select('*').eq('order_id', id).order('approved_at', { ascending: false });
      if (error) throw error;
      setApprovalHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de aprovações:', error);
    }
  };

  const deleteApproval = async (approvalId: string) => {
    try {
      const { error } = await supabase.from('approval_history').delete().eq('id', approvalId);
      if (error) throw error;

      toast({
        title: 'Aprovação excluída',
        description: 'O registro de aprovação foi removido com sucesso.',
      });

      loadApprovalHistory();
    } catch (error) {
      console.error('Erro ao excluir aprovação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a aprovação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const onEditSubmit = async (data: any) => {
    if (!order || !id) return;

    setUpdating(true);
    try {
      let entryDateISO: string | null = null;
      let estimatedCompletionISO: string | null = null;
      let completedAtISO: string | null = null;

      if (data.entry_date) entryDateISO = data.entry_date + 'T12:00:00.000Z';
      if (data.estimated_completion) estimatedCompletionISO = data.estimated_completion + 'T12:00:00.000Z';
      if (data.completed_at) completedAtISO = data.completed_at + 'T12:00:00.000Z';

      const laborCost = parseFloat(data.labor_cost) || null;
      const partsCost = parseFloat(data.parts_cost) || null;
      const totalCost = (laborCost || 0) + (partsCost || 0);
      const discountAmount = parseFloat(data.discount_amount) || 0;

      await updateServiceOrder(id, {
        equipment: data.equipment,
        serial_number: data.serial_number || null,
        problem_description: data.problem_description,
        entry_date: entryDateISO,
        estimated_completion: estimatedCompletionISO,
        completed_at: completedAtISO,
        status: data.status,
        labor_cost: laborCost,
        parts_cost: partsCost,
        total_cost: totalCost > 0 ? totalCost : null,
        discount_amount: discountAmount,
        discount_reason: data.discount_reason || null,
      });

      toast({
        title: 'Ordem atualizada',
        description: 'Todas as alterações foram salvas com sucesso',
      });

      setEditMode(false);
      loadOrder();
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a ordem',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const onStatusSubmit = async (data: any) => {
    if (!order || !id || !user) return;

    setUpdating(true);

    // ✅ Vamos preparar WA, mas NUNCA abrir automaticamente
    let nextWhatsUrl = '';
    let nextWhatsTitle = 'Abrir WhatsApp';
    let nextWhatsHint = 'Clique no botão abaixo para abrir o WhatsApp e enviar a mensagem.';

    try {
      // ====== CASO 1: awaiting_approval ======
      if (data.status === 'awaiting_approval') {
        const laborCost = parseFloat(data.labor_cost) || 0;
        const partsCost = parseFloat(data.parts_cost) || 0;
        const totalCost = laborCost + partsCost;

        const newApprovalToken = crypto.randomUUID();

        await updateServiceOrder(id, {
          status: data.status,
          labor_cost: laborCost,
          parts_cost: partsCost,
          total_cost: totalCost,
          budget_notes: data.budget_notes || null,
          approval_token: newApprovalToken,
          budget_approved: false,
          approved_at: null,
        });

        const updatedOrder = await getServiceOrder(id);
        if (!updatedOrder) throw new Error('Ordem de serviço não encontrada');

        // ✅ FIX: sem "#/#"
        const approvalUrl = `${window.location.origin}/#/approve/${updatedOrder.approval_token}`;

        const budgetMessage = `🔔 *ORÇAMENTO DISPONÍVEL*

Olá ${order.client.name || 'Cliente'}!

Seu orçamento para o reparo do equipamento *${order.equipment}* está pronto:

💰 *Detalhamento do Orçamento:*
${laborCost > 0 ? `• Mão de Obra: R$ ${laborCost.toFixed(2).replace('.', ',')}` : ''}
${partsCost > 0 ? `• Peças: R$ ${partsCost.toFixed(2).replace('.', ',')}` : ''}
• *TOTAL: R$ ${totalCost.toFixed(2).replace('.', ',')}*

${data.budget_notes ? `📝 *Observações:*\n${data.budget_notes}\n\n` : ''}✅ *Para aprovar o orçamento, clique no link abaixo:*
${approvalUrl}

🔐 *Dados de Acesso ao Sistema:*
• Login: ${order.client.email}
• Senha: 123456
• Acesse: ${window.location.origin}/#/login

Após a aprovação, daremos continuidade ao reparo imediatamente! 🔧`;

        await createMessage({
          order_id: id,
          sender_id: user.id,
          content: budgetMessage,
        });

        if (order.client.phone) {
          const whatsappTemplate = await getSystemSetting('whatsapp_template_budget_request');

          if (whatsappTemplate) {
            const formattedLaborCost = laborCost.toFixed(2).replace('.', ',');
            const formattedPartsCost = partsCost.toFixed(2).replace('.', ',');
            const formattedTotalCost = totalCost.toFixed(2).replace('.', ',');

            const formattedObservations = data.budget_notes ? `📝 *Observações:*\n${data.budget_notes}\n\n` : '';

            const whatsappMessage = whatsappTemplate
              .replace(/{nome_cliente}/g, order.client.name || 'Cliente')
              .replace(/{cliente_nome}/g, order.client.name || 'Cliente')
              .replace(/{numero_os}/g, order.order_number)
              .replace(/{equipamento}/g, order.equipment)
              .replace(/{valor_mao_obra}/g, formattedLaborCost)
              .replace(/{valor_pecas}/g, formattedPartsCost)
              .replace(/{valor_total}/g, formattedTotalCost)
              .replace(/{observacoes}/g, formattedObservations)
              .replace(/{link_aprovacao}/g, approvalUrl);

            let phoneNumber = order.client.phone.replace(/\D/g, '');
            if ((phoneNumber.length === 10 || phoneNumber.length === 11) && !phoneNumber.startsWith('55')) phoneNumber = '55' + phoneNumber;

            nextWhatsUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
            nextWhatsTitle = 'Enviar orçamento no WhatsApp';
            nextWhatsHint = 'Clique para abrir o WhatsApp já com a mensagem pronta.';
          } else {
            toast({
              title: 'Aviso',
              description:
                'Template de orçamento não configurado. Configure em Admin > Configurações > WhatsApp para enviar mensagens automáticas.',
              variant: 'default',
            });
          }
        }
      }

      // ====== CASO 2: ready_for_pickup ======
      else if (data.status === 'ready_for_pickup') {
        await updateServiceOrderStatus(id, data.status, data.notes || null, user.id);

        const whatsappTemplate = await getSystemSetting('whatsapp_template_ready_for_pickup');
        const businessAddress = (await getSystemSetting('business_address')) || '';
        const businessHours = (await getSystemSetting('business_hours')) || '';

        if (whatsappTemplate) {
          const msg = whatsappTemplate
            .replace(/{nome_cliente}/g, order.client.name || 'Cliente')
            .replace(/{cliente_nome}/g, order.client.name || 'Cliente')
            .replace(/{numero_os}/g, order.order_number)
            .replace(/{equipamento}/g, order.equipment)
            .replace(/{endereco}/g, businessAddress)
            .replace(/{address}/g, businessAddress)
            .replace(/{horario}/g, businessHours)
            .replace(/{business_hours}/g, businessHours)
            .replace(/{valor_total}/g, order.total_cost ? `💰 *Valor total:* R$ ${order.total_cost.toFixed(2).replace('.', ',')}\n` : '')
            .replace(
              /{desconto}/g,
              order.discount_amount && order.discount_amount > 0
                ? `🎁 *Desconto aplicado:* R$ ${order.discount_amount.toFixed(2).replace('.', ',')}\n`
                : ''
            )
            .replace(
              /{valor_final}/g,
              order.discount_amount && order.discount_amount > 0 && order.total_cost
                ? `✨ *Valor final:* R$ ${(order.total_cost - order.discount_amount).toFixed(2).replace('.', ',')}\n\n`
                : ''
            )
            .replace(/{observacoes}/g, data.notes ? `📝 *Observações:*\n${data.notes}\n\n` : '');

          await createMessage({ order_id: id, sender_id: user.id, content: msg });

          if (order.client.phone) {
            let phoneNumber = order.client.phone.replace(/\D/g, '');
            if ((phoneNumber.length === 10 || phoneNumber.length === 11) && !phoneNumber.startsWith('55')) phoneNumber = '55' + phoneNumber;

            nextWhatsUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`;
            nextWhatsTitle = 'Avisar “Pronto para retirada” no WhatsApp';
            nextWhatsHint = 'Clique para abrir o WhatsApp já com a mensagem pronta.';
          }
        } else {
          toast({
            title: 'Aviso',
            description: 'Template de WhatsApp não configurado. Configure em Admin > Configurações > WhatsApp.',
            variant: 'default',
          });
        }
      }

      // ====== CASO 3: not_approved ======
      else if (data.status === 'not_approved') {
        await updateServiceOrderStatus(id, data.status, data.notes || null, user.id);

        const whatsappTemplate = await getSystemSetting('whatsapp_template_not_approved');
        const businessAddress = (await getSystemSetting('business_address')) || '';
        const businessHours = (await getSystemSetting('business_hours')) || '';

        if (whatsappTemplate) {
          const msg = whatsappTemplate
            .replace(/{nome_cliente}/g, order.client.name || 'Cliente')
            .replace(/{cliente_nome}/g, order.client.name || 'Cliente')
            .replace(/{numero_os}/g, order.order_number)
            .replace(/{equipamento}/g, order.equipment)
            .replace(/{endereco}/g, businessAddress)
            .replace(/{address}/g, businessAddress)
            .replace(/{horario}/g, businessHours)
            .replace(/{business_hours}/g, businessHours)
            .replace(/{observacoes}/g, data.notes ? `📝 *Observações:*\n${data.notes}\n\n` : '');

          await createMessage({ order_id: id, sender_id: user.id, content: msg });

          if (order.client.phone) {
            let phoneNumber = order.client.phone.replace(/\D/g, '');
            if ((phoneNumber.length === 10 || phoneNumber.length === 11) && !phoneNumber.startsWith('55')) phoneNumber = '55' + phoneNumber;

            nextWhatsUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`;
            nextWhatsTitle = 'Avisar “Orçamento não aprovado” no WhatsApp';
            nextWhatsHint = 'Clique para abrir o WhatsApp já com a mensagem pronta.';
          }
        } else {
          toast({
            title: 'Aviso',
            description: 'Template de “não aprovado” não configurado. Configure em Admin > Configurações > WhatsApp.',
            variant: 'default',
          });
        }

        // Telegram (não derruba o fluxo se falhar)
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: {
              orderNumber: order.order_number,
              equipment: order.equipment,
              clientName: order.client.name || order.client.email || 'Cliente',
              notificationType: 'not_approved',
            },
          });
        } catch (telegramError) {
          console.error('Erro ao enviar notificação do Telegram:', telegramError);
        }
      }

      // ====== CASO 4: outros ======
      else {
        await updateServiceOrderStatus(id, data.status, data.notes || null, user.id);

        // completed/delivered: tenta enviar via backend (se existir), mas NÃO abre WA na marra
        if (data.status === 'completed' || data.status === 'delivered') {
          try {
            const { sendOrderCompletedWhatsApp } = await import('@/db/api');
            await sendOrderCompletedWhatsApp(id);
          } catch (whatsappError) {
            console.error('Erro ao enviar WhatsApp de conclusão:', whatsappError);
          }
        }
      }

      toast({
        title: 'Status atualizado',
        description: nextWhatsUrl
          ? 'Status salvo. Agora clique para abrir o WhatsApp com a mensagem pronta.'
          : 'O status da ordem foi atualizado com sucesso.',
      });

      // Fecha diálogo do status normalmente
      setStatusDialogOpen(false);
      statusForm.reset();

      // Recarrega dados
      await Promise.all([loadOrder(), loadHistory(), loadApprovalHistory()]);

      // ✅ Se houver WA, mostra dialog COM BOTÃO (clique humano)
      if (nextWhatsUrl) {
        setWhatsappUrl(nextWhatsUrl);
        setWhatsDialogTitle(nextWhatsTitle);
        setWhatsDialogHint(nextWhatsHint);
        setWhatsDialogOpen(true);
      } else {
        setWhatsappUrl('');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteServiceOrder(id);

      toast({
        title: 'Ordem excluída',
        description: 'A ordem foi excluída com sucesso',
      });

      navigate('/admin/orders');
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a ordem',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDiscountSubmit = async (data: { discount_amount: string; discount_reason: string }) => {
    if (!id) return;

    setUpdating(true);
    try {
      const discountAmount = parseFloat(data.discount_amount) || 0;

      if (discountAmount < 0) {
        toast({
          title: 'Erro',
          description: 'O valor do desconto não pode ser negativo',
          variant: 'destructive',
        });
        return;
      }

      if (discountAmount > 0 && !data.discount_reason.trim()) {
        toast({
          title: 'Erro',
          description: 'O motivo do desconto é obrigatório',
          variant: 'destructive',
        });
        return;
      }

      await updateServiceOrderDiscount(id, discountAmount, data.discount_reason);

      toast({
        title: 'Desconto atualizado',
        description: 'O desconto foi aplicado com sucesso',
      });

      setDiscountDialogOpen(false);
      loadOrder();
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aplicar o desconto',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">Ordem não encontrada</p>
            <Button onClick={() => navigate('/admin/orders')}>Voltar</Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 pb-6">
        {/* ✅ Dialog de WhatsApp: só abre por clique */}
        <Dialog open={whatsDialogOpen} onOpenChange={setWhatsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{whatsDialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{whatsDialogHint}</p>

              <div className="flex flex-col gap-2">
                <Button onClick={handleOpenWhatsAppClick} className="h-11 text-base">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir WhatsApp agora
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 text-base"
                  onClick={() => {
                    // fallback simples: copiar link
                    try {
                      navigator.clipboard.writeText(whatsappUrl);
                      toast({ title: 'Link copiado', description: 'Cole no WhatsApp se precisar.' });
                    } catch {
                      toast({
                        title: 'Não consegui copiar automaticamente',
                        description: 'Copie manualmente o link exibido abaixo.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Copiar link
                </Button>

                <div className="p-2 border rounded text-xs break-all bg-muted/30">{whatsappUrl}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Header - Mobile Optimized */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')} className="shrink-0 h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold truncate">OS #{order.order_number}</h1>
            <p className="text-sm text-muted-foreground truncate">{order.equipment}</p>
          </div>
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!editMode ? (
            <>
              <Button
                variant="default"
                className="w-full sm:w-auto h-11 text-base"
                onClick={() => setEditMode(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar OS
              </Button>

              <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto h-11 text-base">Atualizar Status</Button>
                </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Atualizar Status</DialogTitle>
              </DialogHeader>
              <Form {...statusForm}>
                <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
                  <FormField
                    control={statusForm.control}
                    name="status"
                    rules={{ required: 'Status é obrigatório' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Novo Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 text-base">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value} className="text-base py-3">
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Fields - Show only when status is awaiting_approval */}
                  {selectedStatus === 'awaiting_approval' && (
                    <div className="space-y-4 p-4 bg-primary/5 rounded-lg border-2 border-primary">
                      <h3 className="font-semibold text-lg">Detalhamento do Orçamento</h3>

                      <FormField
                        control={statusForm.control}
                        name="labor_cost"
                        rules={{
                          required: 'Mão de obra é obrigatória',
                          pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Digite um valor válido (ex: 150.00)' },
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mão de Obra (R$) *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" className="h-11 text-base" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={statusForm.control}
                        name="parts_cost"
                        rules={{
                          required: 'Valor das peças é obrigatório',
                          pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Digite um valor válido (ex: 250.00)' },
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peças (R$) *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" className="h-11 text-base" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="p-3 bg-background rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">Total:</span>
                          <span className="font-bold text-xl text-primary">
                            R${' '}
                            {(
                              (parseFloat(statusForm.watch('labor_cost')) || 0) +
                              (parseFloat(statusForm.watch('parts_cost')) || 0)
                            )
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      <FormField
                        control={statusForm.control}
                        name="budget_notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações do Orçamento (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ex: Inclui limpeza completa, troca de pasta térmica..."
                                className="min-h-[100px] text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={statusForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações {selectedStatus === 'awaiting_approval' ? 'Internas' : ''} (opcional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea placeholder="Adicione observações sobre esta atualização" className="min-h-[120px] text-base pr-12" {...field} />
                            <div className="absolute right-2 top-2">
                              <VoiceInput onTranscript={(text) => field.onChange(text)} appendMode={true} />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)} className="h-11 text-base">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updating} className="h-11 text-base">
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        'Atualizar'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button
            variant={showDiagnostic ? 'default' : 'outline'}
            className="w-full sm:w-auto h-11 text-base"
            onClick={() => setShowDiagnostic(!showDiagnostic)}
          >
            <Brain className="h-4 w-4 mr-2" />
            {showDiagnostic ? 'Ocultar' : 'Diagnóstico IA'}
          </Button>
          </>
          ) : (
            <>
              <Button
                variant="default"
                className="w-full sm:w-auto h-11 text-base"
                onClick={editForm.handleSubmit(onEditSubmit)}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 text-base"
                onClick={() => {
                  setEditMode(false);
                  if (order) {
                    editForm.reset({
                      equipment: order.equipment,
                      serial_number: order.serial_number || '',
                      problem_description: order.problem_description,
                      entry_date: order.entry_date ? format(new Date(order.entry_date), 'yyyy-MM-dd') : '',
                      estimated_completion: order.estimated_completion ? format(new Date(order.estimated_completion), 'yyyy-MM-dd') : '',
                      completed_at: order.completed_at ? format(new Date(order.completed_at), 'yyyy-MM-dd') : '',
                      status: order.status,
                      notes: '',
                      labor_cost: order.labor_cost ? order.labor_cost.toString() : '',
                      parts_cost: order.parts_cost ? order.parts_cost.toString() : '',
                      discount_amount: order.discount_amount ? order.discount_amount.toString() : '',
                      discount_reason: order.discount_reason || '',
                    });
                  }
                }}
                disabled={updating}
              >
                Cancelar
              </Button>
            </>
          )}
        </div>

        {/* Timeline de Progresso */}
        {order.entry_date && (
          <OrderProgressTimeline
            entryDate={order.entry_date}
            estimatedCompletion={order.estimated_completion}
            completedAt={order.completed_at}
            status={order.status}
            history={history}
            approvalHistory={approvalHistory}
          />
        )}

        <div className={cn('grid grid-cols-1 gap-4', showDiagnostic ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}>
          {showDiagnostic && (
            <div className="xl:col-span-1 xl:order-last">
              <div className="xl:sticky xl:top-4">
                <DiagnosticAssistant
                  problemDescription={order.problem_description}
                  equipment={order.equipment}
                  orderId={order.id}
                  status={order.status}
                  onClose={() => setShowDiagnostic(false)}
                />
              </div>
            </div>
          )}

          <Card className="xl:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!editMode ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                    <p className="font-medium text-base">{order.client.name || order.client.email}</p>
                    {order.client.phone && <p className="text-sm text-muted-foreground">{order.client.phone}</p>}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Equipamento</p>
                    <p className="font-medium text-base">{order.equipment}</p>
                  </div>

                  {order.serial_number && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Número de Série (S/N)</p>
                      <p className="font-medium font-mono text-sm break-all">{order.serial_number}</p>
                    </div>
                  )}

                  {order.entry_date && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Data de Entrada</p>
                      <p className="font-medium text-base">{format(new Date(order.entry_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Problema</p>
                    <p className="font-medium text-base">{order.problem_description}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="mt-1">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                    <p className="font-medium text-base">{format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>

                  {order.estimated_completion && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Previsão de Conclusão</p>
                      <p className="font-medium text-base">{format(new Date(order.estimated_completion), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                  )}

                  {order.completed_at && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Concluído em</p>
                      <p className="font-medium text-base">{format(new Date(order.completed_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                  )}

                  {(order.labor_cost || order.parts_cost) && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Custos</p>
                      {order.labor_cost && <p className="text-sm">Mão de obra: R$ {order.labor_cost.toFixed(2)}</p>}
                      {order.parts_cost && <p className="text-sm">Peças: R$ {order.parts_cost.toFixed(2)}</p>}
                      {order.total_cost && <p className="font-medium">Total: R$ {order.total_cost.toFixed(2)}</p>}
                    </div>
                  )}

                  {order.discount_amount && order.discount_amount > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                      <p className="font-medium">R$ {order.discount_amount.toFixed(2)}</p>
                      {order.discount_reason && <p className="text-xs text-muted-foreground">{order.discount_reason}</p>}
                    </div>
                  )}
                </>
              ) : (
                <Form {...editForm}>
                  <div className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="equipment"
                      rules={{ required: 'Equipamento é obrigatório' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipamento</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="serial_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Série</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="entry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Entrada</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="problem_description"
                      rules={{ required: 'Descrição é obrigatória' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Problema</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {allStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="estimated_completion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previsão de Conclusão</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="completed_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Conclusão</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="labor_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mão de Obra (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="parts_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peças (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="discount_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desconto (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="discount_reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo do Desconto</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              )}
            </CardContent>
          </Card>

          <WarrantyStatus order={order} onUpdate={loadOrder} isAdmin={true} />

          <div className={cn(showDiagnostic ? 'xl:col-span-3' : 'xl:col-span-2')}>
            <Tabs defaultValue="timeline">
              <TabsList className="grid w-full grid-cols-5 h-auto xl:h-11 gap-1 p-1">
                <TabsTrigger value="timeline" className="text-xs xl:text-sm px-2 py-2">
                  <span className="hidden xl:inline">Histórico</span>
                  <span className="xl:hidden">📋</span>
                </TabsTrigger>
                <TabsTrigger value="photos" className="text-xs xl:text-sm px-2 py-2">
                  <span className="hidden xl:inline">Fotos</span>
                  <span className="xl:hidden">📷</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-xs xl:text-sm px-2 py-2">
                  <span className="hidden xl:inline">Mensagens</span>
                  <span className="xl:hidden">💬</span>
                </TabsTrigger>
                <TabsTrigger value="ai-suggestions" className="text-xs xl:text-sm px-2 py-2">
                  <span className="hidden xl:inline">Sugestões IA</span>
                  <span className="xl:hidden">🤖</span>
                </TabsTrigger>
                <TabsTrigger value="learning" className="text-xs xl:text-sm px-2 py-2">
                  <span className="hidden xl:inline">Aprendizado</span>
                  <span className="xl:hidden">📚</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {history.length === 0 && approvalHistory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nenhum histórico disponível</p>
                    ) : (
                      <OrderTimeline history={history} approvalHistory={approvalHistory} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="photos">
                <OrderImageGallery orderId={order.id} isAdmin={true} />
              </TabsContent>

              <TabsContent value="chat">
                <Card>
                  <CardHeader>
                    <CardTitle>Mensagens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatBox orderId={order.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-suggestions">
                <IntelligentFlow
                  equipment={order.equipment}
                  problemDescription={order.problem_description}
                  status={order.status}
                  hasConclusion={!!order.completed_at}
                  hasParts={!!order.parts_cost && order.parts_cost > 0}
                  hasValue={!!order.total_cost && order.total_cost > 0}
                  onApplyDeadline={(days) => {
                    const newDate = new Date();
                    newDate.setDate(newDate.getDate() + days);
                    editForm.setValue('estimated_completion', format(newDate, 'yyyy-MM-dd'));
                    toast({
                      title: 'Prazo aplicado',
                      description: `Prazo de ${days} dias foi aplicado. Salve as alterações.`,
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="learning">
                <SolutionLearning
                  orderId={order.id}
                  equipment={order.equipment}
                  problemDescription={order.problem_description}
                  onSaved={() => {
                    toast({
                      title: 'Sucesso',
                      description: 'Solução registrada com sucesso!',
                    });
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
