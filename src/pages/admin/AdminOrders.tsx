import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Plus, Search, Trash2, UserPlus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { OrderStatusBadge, statusConfig } from '@/components/OrderStatusBadge';
import { AIOpeningAssistant } from '@/components/AIOpeningAssistant';
import WebSearchAssistant from '@/components/WebSearchAssistant';
import { OrderConfirmationDialog } from '@/components/OrderConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultipleImageUpload } from '@/components/ui/MultipleImageUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SmartInput } from '@/components/ui/SmartInput';
import { SmartTextarea } from '@/components/ui/SmartTextarea';
import { Textarea } from '@/components/ui/textarea';
import {
  createClientProfile,
  createServiceOrder,
  generateOrderNumber,
  getAllProfiles,
  getAllServiceOrders,
  getServiceOrderByOrderNumber,
  uploadOrderImage,
} from '@/db/api';
import { ensureFreshSession } from '@/db/supabase';
import { loadAdminCache, saveAdminCache } from '@/utils/adminCache';
import { safeStorage } from '@/utils/safeStorage';
import { secureTabStorage } from '@/utils/secureTabStorage';
import { useToast } from '@/hooks/use-toast';
import type { Profile, ServiceOrderWithClient, OrderStatus } from '@/types/types';

// Chave para salvar o rascunho do formulário
const FORM_DRAFT_KEY = 'admin_order_form_draft';
const PENDING_CONFIRMATION_KEY = 'admin_order_pending_confirmation';
type OrderDraft = Record<string, any>;
type CreatingSession = {
  orderNumber: string;
  startedAt: number;
  opId: string;
  resolved: boolean;
};

// Helpers para input type="date" + ISO estável sem bug de timezone
const toDateInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const dateInputToLocalISOString = (dateStr: string) => {
  // Usa meio-dia local para não “virar dia” em UTC
  const d = new Date(`${dateStr}T12:00:00`);
  const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tzAdjusted.toISOString();
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const creatingSessionRef = useRef<CreatingSession | null>(null);
  const pendingOrderRef = useRef<OrderDraft | null>(null);
  const resolvingVisibilityRef = useRef(false);
  const [orders, setOrders] = useState<ServiceOrderWithClient[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrderWithClient[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Ler filtros da URL ao carregar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status && status !== 'all') {
      setStatusFilter(status);
    }
  }, [location.search]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [hasMultipleItems, setHasMultipleItems] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [additionalItems, setAdditionalItems] = useState<
    Array<{
      id: string;
      equipment: string;
      serial_number: string;
      description: string;
    }>
  >([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  useEffect(() => {
    if (!showConfirmation) return;

    const handleVisibilityRecovery = () => {
      setCreating(false);
      if (creatingSessionRef.current?.resolved === false) {
        creatingSessionRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityRecovery);
    window.addEventListener('pageshow', handleVisibilityRecovery);
    window.addEventListener('focus', handleVisibilityRecovery);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityRecovery);
      window.removeEventListener('pageshow', handleVisibilityRecovery);
      window.removeEventListener('focus', handleVisibilityRecovery);
    };
  }, [showConfirmation]);

  const form = useForm({
    defaultValues: {
      client_id: '',
      // New client fields
      new_client_first_name: '',
      new_client_last_name: '',
      new_client_email: '',
      new_client_phone: '',
      new_client_password: '123456',

      // Order fields
      entry_date: '', // ✅ novo: permite data retroativa
      equipment: '',
      serial_number: '',
      equipment_photo_url: '',
      problem_description: '',
      estimated_completion: '',
    },
  });

  // Restaurar rascunho do formulário ao abrir o diálogo
  useEffect(() => {
    if (!dialogOpen) return;

    const savedDraft = secureTabStorage.getItem(FORM_DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.reset(draft);
        toast({
          title: 'Rascunho restaurado',
          description: 'Seus dados foram recuperados automaticamente',
        });
        return;
      } catch (error) {
        console.warn('Erro ao restaurar rascunho:', error);
      }
    }

    // ✅ Novo formulário: garante que não “herda” dados da última OS
    form.reset();
    setIsNewClient(false);
    setHasMultipleItems(false);
    setAdditionalItems([]);
    setSelectedImages([]);
  }, [dialogOpen]);

  // ✅ Garantir default do entry_date = hoje, se não vier do draft
  useEffect(() => {
    if (!dialogOpen) return;
    const current = form.getValues('entry_date');
    if (!current) {
      form.setValue('entry_date', toDateInput(new Date()), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen]);

  // Check if we should open dialog from navigation state
  useEffect(() => {
    if (location.state?.openDialog) {
      setDialogOpen(true);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Auto-salvar formulário a cada mudança
  useEffect(() => {
    if (!dialogOpen) return;

    const subscription = form.watch((values) => {
      secureTabStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [dialogOpen, form]);

  const loadData = useCallback(async () => {
    try {
      const [ordersData, clientsData] = await Promise.all([getAllServiceOrders(), getAllProfiles()]);

      setOrders(ordersData);
      setClients(clientsData.filter((c) => c.role === 'client'));

      // ✅ cache para modo offline
      saveAdminCache({
        orders: ordersData,
        clients: clientsData,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);

      // ✅ fallback offline
      const cache = loadAdminCache();
      if (cache) {
        setOrders(cache.orders);
        setClients(cache.clients.filter((c) => c.role === 'client'));
        toast({
          title: 'Modo offline',
          description: 'Carreguei dados do cache local. Novas OS/imagens serão sincronizadas ao voltar a conexão.',
        });
      } else {
        toast({
          title: 'Sem conexão',
          description: 'Você está offline e ainda não existe cache local neste dispositivo.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    if (!showConfirmation) return;

    const handleResume = () => {
      setCreating(false);
      if (creatingSessionRef.current?.resolved === false) {
        creatingSessionRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pageshow', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [showConfirmation]);

  const resetCreationForm = useCallback(() => {
    setShowConfirmation(false);
    setDialogOpen(false);
    form.reset();
    setIsNewClient(false);
    setHasMultipleItems(false);
    setAdditionalItems([]);
    setSelectedImages([]);
    setPendingOrderData(null);
    pendingOrderRef.current = null;
    secureTabStorage.removeItem(PENDING_CONFIRMATION_KEY);
  }, [form]);

  const finalizeCreationSuccess = useCallback(
    async (order: { order_number?: string; id: string }, source: string) => {
      if (creatingSessionRef.current) {
        creatingSessionRef.current.resolved = true;
      }

      setCreating(false);
      toast({
        title: 'Ordem criada',
        description: `OS ${order.order_number || order.id}${source ? ` (${source})` : ''}`,
      });

      safeStorage.removeItem(FORM_DRAFT_KEY);
      safeStorage.removeItem('ORDER_DRAFT_FALLBACK');

      resetCreationForm();
      await loadData();
    },
    [loadData, resetCreationForm, toast]
  );

  const finalizeCreationError = useCallback(
    (message: string) => {
      if (creatingSessionRef.current) {
        creatingSessionRef.current.resolved = true;
      }

      setCreating(false);
      toast({
        title: 'Erro ao criar OS',
        description: message,
        variant: 'destructive',
      });

      if (pendingOrderRef.current) {
        safeStorage.setItem('ORDER_DRAFT_FALLBACK', JSON.stringify(pendingOrderRef.current));
      }
      setPendingOrderData(null);
      pendingOrderRef.current = null;
      secureTabStorage.removeItem(PENDING_CONFIRMATION_KEY);
    },
    [toast]
  );

  const readDraftFromStorage = useCallback(() => {
    const draftValue =
      secureTabStorage.getItem(PENDING_CONFIRMATION_KEY) ||
      secureTabStorage.getItem('ORDER_DRAFT_FALLBACK') ||
      secureTabStorage.getItem(FORM_DRAFT_KEY);
    if (!draftValue) return null;

    try {
      return JSON.parse(draftValue) as OrderDraft;
    } catch (error) {
      console.warn('Erro ao restaurar rascunho da OS:', error);
      return null;
    }
  }, []);

  const resolveCreationOnVisibility = useCallback(
    async (source: string) => {
      if (resolvingVisibilityRef.current) return;
      const session = creatingSessionRef.current;
      let snapshot = null;
      const snapshotValue = secureTabStorage.getItem('ORDER_DRAFT_FALLBACK');
      if (snapshotValue) {
        try {
          snapshot = JSON.parse(snapshotValue);
        } catch (error) {
          console.warn('Erro ao ler snapshot da OS:', error);
        }
      }
      const orderNumber = session?.orderNumber || snapshot?.order_number;
      if (!orderNumber || session?.resolved) return;

      resolvingVisibilityRef.current = true;
      try {
        const existingOrder = await getServiceOrderByOrderNumber(orderNumber);
        if (existingOrder) {
          if (source === 'retorno ao foco') {
            toast({
              title: 'OS recuperada após retorno do foco',
              description: `OS ${existingOrder.order_number || existingOrder.id} confirmada ao voltar para a aba.`,
            });
          }
          await finalizeCreationSuccess(existingOrder, source);
        } else if (creating) {
          finalizeCreationError(`Não foi possível confirmar a criação da OS ${orderNumber}.`);
        }
      } catch (lookupError) {
        console.warn('Falha ao buscar OS por order_number:', lookupError);
        if (creating) {
          finalizeCreationError('Não foi possível confirmar a criação da OS ao retornar ao foco.');
        }
      } finally {
        resolvingVisibilityRef.current = false;
      }
    },
    [creating, finalizeCreationError, finalizeCreationSuccess, toast]
  );

  const restorePendingConfirmation = useCallback(() => {
    const pending = readDraftFromStorage();
    if (!pending) {
      secureTabStorage.removeItem(PENDING_CONFIRMATION_KEY);
      return;
    }

    setPendingOrderData(pending);
    pendingOrderRef.current = pending;
  }, [readDraftFromStorage]);

  const handleConfirmationOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setCreating(false);
        restorePendingConfirmation();
      }
      setShowConfirmation(open);
    },
    [restorePendingConfirmation]
  );

  const handleConfirmationCancel = useCallback(() => {
    setPendingOrderData(null);
    pendingOrderRef.current = null;
    secureTabStorage.removeItem(PENDING_CONFIRMATION_KEY);
    setShowConfirmation(false);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void resolveCreationOnVisibility('retorno ao foco');
      }
    };
    const onPageShow = () => void resolveCreationOnVisibility('pageshow');
    const onFocus = () => void resolveCreationOnVisibility('focus');
    const onResume = () => void resolveCreationOnVisibility('resume');

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    document.addEventListener('resume', onResume as EventListener);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('resume', onResume as EventListener);
    };
  }, [resolveCreationOnVisibility]);

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      // Handle special filters
      if (statusFilter === 'in_progress') {
        filtered = filtered.filter((order) => ['analyzing', 'in_repair', 'awaiting_parts'].includes(order.status));
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter((order) => ['completed', 'ready_for_pickup'].includes(order.status));
      } else {
        filtered = filtered.filter((order) => order.status === statusFilter);
      }
    }

    setFilteredOrders(filtered);
  };

  // Funções para gerenciar itens adicionais
  const addAdditionalItem = () => {
    setAdditionalItems([
      ...additionalItems,
      {
        id: `temp-${Date.now()}`,
        equipment: '',
        serial_number: '',
        description: '',
      },
    ]);
  };

  const removeAdditionalItem = (id: string) => {
    setAdditionalItems(additionalItems.filter((item) => item.id !== id));
  };

  const updateAdditionalItem = (id: string, field: string, value: string) => {
    setAdditionalItems(additionalItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const onSubmit = async (data: any) => {
    // Validar cliente
    if (!isNewClient && !data.client_id) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente ou marque "Novo Cliente"',
        variant: 'destructive',
      });
      return;
    }

    // Validar novo cliente
    if (isNewClient) {
      if (
        !data.new_client_first_name ||
        !data.new_client_last_name ||
        !data.new_client_email ||
        !data.new_client_phone ||
        !data.new_client_password
      ) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios do cliente',
          variant: 'destructive',
        });
        return;
      }

      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(data.new_client_email)) {
        toast({
          title: 'Erro',
          description: 'E-mail inválido',
          variant: 'destructive',
        });
        return;
      }

      if (data.new_client_password.length < 6) {
        toast({
          title: 'Erro',
          description: 'A senha deve ter pelo menos 6 caracteres',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validar equipamento
    if (!data.equipment || data.equipment.trim().length === 0) {
      toast({
        title: 'Erro',
        description: 'Informe o equipamento',
        variant: 'destructive',
      });
      return;
    }

    // Validar descrição do problema
    if (!data.problem_description || data.problem_description.trim().length === 0) {
      toast({
        title: 'Erro',
        description: 'Descreva o problema relatado',
        variant: 'destructive',
      });
      return;
    }

    // Validar itens adicionais
    if (hasMultipleItems && additionalItems.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um item adicional ou desmarque "Múltiplos equipamentos"',
        variant: 'destructive',
      });
      return;
    }

    if (hasMultipleItems) {
      const invalidItems = additionalItems.filter((item) => !item.equipment.trim());
      if (invalidItems.length > 0) {
        toast({
          title: 'Erro',
          description: 'Preencha o nome do equipamento para todos os itens adicionais',
          variant: 'destructive',
        });
        return;
      }
    }

    // Todas as validações passaram - mostrar confirmação
    setPendingOrderData(data);
    pendingOrderRef.current = data;
    secureTabStorage.setItem('ORDER_DRAFT_FALLBACK', JSON.stringify(data));
    secureTabStorage.setItem(PENDING_CONFIRMATION_KEY, JSON.stringify(data));
    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    const data = pendingOrderRef.current ?? readDraftFromStorage();

    if (!data) {
      toast({
        title: 'Dados da OS não encontrados',
        description: 'Não foi possível recuperar o rascunho. Revise a confirmação e tente novamente.',
        variant: 'destructive',
      });
      setShowConfirmation(true);
      return;
    }

    setPendingOrderData(data);
    pendingOrderRef.current = data;

    if (document.visibilityState !== 'visible') return;
    const hasFreshSession = await ensureFreshSession();
    if (!hasFreshSession) {
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente para continuar.',
        variant: 'destructive',
      });
      return;
    }

    const opId = `createOS_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const startedAt = Date.now();
    setCreating(true);
    const orderNumber = generateOrderNumber();
    const snapshot = { ...data, order_number: orderNumber };
    secureTabStorage.setItem('ORDER_DRAFT_FALLBACK', JSON.stringify(snapshot));
    creatingSessionRef.current = {
      orderNumber,
      startedAt,
      opId,
      resolved: false,
    };
    const abortController = new AbortController();
    const shouldAbortOnVisibility = false;
    let didAbortFromVisibility = false;
    let didAbortNotify = false;

    const handleVisibilityChange = () => {
      if (!shouldAbortOnVisibility) return;
      if (document.visibilityState === 'hidden' && !abortController.signal.aborted) {
        didAbortFromVisibility = true;
        abortController.abort();
      }
    };

    const handlePageHide = () => {
      if (!shouldAbortOnVisibility) return;
      if (!abortController.signal.aborted) {
        didAbortFromVisibility = true;
        abortController.abort();
      }
    };

    if (shouldAbortOnVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pagehide', handlePageHide);
    }

    // ✅ Watchdog: se a aba dormir e a Promise nunca resolver, a UI NÃO fica presa
    const WATCHDOG_MS = 20000; // 20s (ajuste se quiser 15s)
    const watchdog = window.setTimeout(() => {
      if (creatingSessionRef.current?.resolved) {
        return;
      }
      const elapsed = Date.now() - startedAt;
      console.warn('[OS]', opId, 'WATCHDOG fired', { elapsed, vis: document.visibilityState });

      // ✅ 1) destrava UI IMEDIATAMENTE (não pode depender de await)
      setCreating(false);

      // ✅ 2) feedback pro usuário
      toast({
        title: 'A criação está demorando',
        description:
          'Se você trocou de aba, o navegador pode pausar requisições. A criação pode concluir em segundo plano; volte para esta aba para conferir ou tente novamente.',
        variant: 'destructive',
      });
      // ✅ 3) tenta recarregar lista sem bloquear nada
      void loadData().catch((e) => console.warn('[OS]', opId, 'WATCHDOG loadData failed', e));
    }, WATCHDOG_MS);

    try {
      let clientId = data.client_id;

      if (isNewClient) {
        const newClient = await createClientProfile({
          name: `${data.new_client_first_name} ${data.new_client_last_name}`,
          email: data.new_client_email,
          phone: data.new_client_phone,
          password: data.new_client_password,
          timeoutMs: 15000,
          abortSignal: abortController.signal,
        });
        clientId = newClient.id;
      }

      const order = await createServiceOrder(
        {
          client_id: clientId,
          entry_date: data.entry_date ? dateInputToLocalISOString(data.entry_date) : undefined,
          equipment: data.equipment,
          serial_number: data.serial_number,
          problem_description: data.problem_description,
          has_multiple_items: hasMultipleItems,
          order_number: orderNumber,
          items: hasMultipleItems
            ? additionalItems.map((it) => ({
                equipment: it.equipment,
                serial_number: it.serial_number || undefined,
                description: it.description || undefined,
              }))
            : undefined,
        },
        // ✅ ADMIN: timeout curto + vis-aware (NÃO 60s)
        { allowOfflineQueue: false, timeoutMs: 15000, abortController }
      );

      // ✅ Upload de imagens: não “quebra” a criação se falhar upload
      if (selectedImages.length > 0) {
        for (const file of selectedImages) {
          try {
            await uploadOrderImage(order.id, file);
          } catch (e) {
            console.warn('Upload falhou (não bloqueia OS):', e);
          }
        }
      }

      toast({
        title: 'Ordem criada',
        description: `OS ${order.order_number || order.id}`,
      });

      // ✅ limpa drafts e fecha diálogos
      secureTabStorage.removeItem(FORM_DRAFT_KEY);
      secureTabStorage.removeItem('ORDER_DRAFT_FALLBACK');
      secureTabStorage.removeItem(PENDING_CONFIRMATION_KEY);

      setShowConfirmation(false);
      setDialogOpen(false);

      // ✅ reset total do estado
      form.reset();
      setIsNewClient(false);
      setHasMultipleItems(false);
      setAdditionalItems([]);
      setSelectedImages([]);
      setPendingOrderData(null);
      if (creatingSessionRef.current?.resolved) {
        return;
      }

      await finalizeCreationSuccess(order, '');
    } catch (err: any) {
      console.error('❌ Falha ao criar OS:', err);

      let recovered = false;
      if (!didAbortFromVisibility && err?.name !== 'AbortError' && orderNumber) {
        try {
          const existingOrder = await getServiceOrderByOrderNumber(orderNumber);
          if (existingOrder) {
            recovered = true;
            toast({
              title: 'Ordem criada',
              description: `OS ${existingOrder.order_number || existingOrder.id}`,
            });

            secureTabStorage.removeItem(FORM_DRAFT_KEY);
            secureTabStorage.removeItem('ORDER_DRAFT_FALLBACK');
            secureTabStorage.removeItem(PENDING_CONFIRMATION_KEY);

            setShowConfirmation(false);
            setDialogOpen(false);
            form.reset();
            setIsNewClient(false);
            setHasMultipleItems(false);
            setAdditionalItems([]);
            setSelectedImages([]);
            setPendingOrderData(null);

            await loadData();
            if (!creatingSessionRef.current?.resolved) {
              await finalizeCreationSuccess(existingOrder, 'recuperado');
            }
          }
        } catch (lookupError) {
          console.warn('Falha ao buscar OS por order_number:', lookupError);
        }
      }

      if (!recovered && !didAbortFromVisibility && err?.name !== 'AbortError') {
        toast({
          title: 'Erro ao criar OS',
          description:
            err?.message?.includes('Failed to fetch') || err?.name === 'TypeError'
              ? 'Sem conexão no momento. Verifique internet e tente novamente.'
              : err?.message || 'Falha inesperada ao criar a OS.',
          variant: 'destructive',
        });
      }

      if (!recovered) {
        // mantém rascunho do form (não apaga)
        secureTabStorage.setItem('ORDER_DRAFT_FALLBACK', JSON.stringify(data));
      }
      if (!recovered && !didAbortFromVisibility && err?.name !== 'AbortError' && !creatingSessionRef.current?.resolved) {
        finalizeCreationError(
          err?.message?.includes('Failed to fetch') || err?.name === 'TypeError'
            ? 'Sem conexão no momento. Verifique internet e tente novamente.'
            : err?.message || 'Falha inesperada ao criar a OS.'
        );
      }
    } finally {
      clearTimeout(watchdog);
      if (shouldAbortOnVisibility) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handlePageHide);
      }
      if (!creatingSessionRef.current?.resolved) {
        setCreating(false);
      }
      if (didAbortFromVisibility && !didAbortNotify) {
        toast({
          title: 'Criação interrompida em background',
          description:
            'A aba foi para segundo plano e a requisição foi cancelada. Verifique a lista de OS; se necessário, tente novamente.',
          variant: 'destructive',
        });
        // mantém rascunho do form (não apaga)
        secureTabStorage.setItem('ORDER_DRAFT_FALLBACK', JSON.stringify(data));
      }
      if (creatingSessionRef.current?.opId === opId) {
        creatingSessionRef.current = null;
      }
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
            <p className="text-muted-foreground">Gerencie todas as ordens de serviço</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ordem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Client Selection or New Client */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Cliente</h3>
                      <Button
                        type="button"
                        variant={isNewClient ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIsNewClient(!isNewClient)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {isNewClient ? 'Selecionar Existente' : 'Novo Cliente'}
                      </Button>
                    </div>

                    {!isNewClient ? (
                      <FormField
                        control={form.control}
                        name="client_id"
                        rules={{ required: 'Cliente é obrigatório' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selecionar Cliente</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name || client.email} {client.phone && `- ${client.phone}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-4 p-4 border border-primary/30 rounded-lg bg-card/50">
                        <p className="text-sm text-muted-foreground">Cadastre um novo cliente para criar a ordem de serviço</p>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="new_client_first_name"
                            rules={{ required: isNewClient ? 'Nome é obrigatório' : false }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome *</FormLabel>
                                <FormControl>
                                  <Input placeholder="João" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_client_last_name"
                            rules={{ required: isNewClient ? 'Sobrenome é obrigatório' : false }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sobrenome *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Silva" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="new_client_email"
                          rules={{
                            required: isNewClient ? 'E-mail é obrigatório' : false,
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'E-mail inválido',
                            },
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="cliente@email.com" {...field} />
                              </FormControl>
                              <FormDescription>O cliente usará este e-mail para fazer login</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="new_client_phone"
                          rules={{ required: isNewClient ? 'Telefone é obrigatório' : false }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 99999-9999" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="new_client_password"
                          rules={{
                            required: isNewClient ? 'Senha é obrigatória' : false,
                            minLength: {
                              value: 6,
                              message: 'A senha deve ter pelo menos 6 caracteres',
                            },
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                              </FormControl>
                              <FormDescription>Senha para o cliente acessar o sistema</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Order Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Detalhes da Ordem</h3>

                    {/* ✅ NOVO: Data de abertura retroativa */}
                    <FormField
                      control={form.control}
                      name="entry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de abertura (pode ser retroativa)</FormLabel>
                          <FormControl>
                            <Input type="date" max={toDateInput(new Date())} value={field.value || ''} onChange={field.onChange} />
                          </FormControl>
                          <FormDescription>
                            Você pode registrar uma OS com data anterior. A previsão continua sendo <strong>hoje + 3 dias</strong>.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="equipment"
                      rules={{ required: 'Equipamento é obrigatório' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipamento</FormLabel>
                          <FormControl>
                            <SmartInput value={field.value} onChange={field.onChange} placeholder="Ex: Notebook, Celular, Computador..." />
                          </FormControl>
                          <FormDescription>Use as sugestões ou digite o equipamento</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serial_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Série (S/N)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: ABC123456789" {...field} />
                          </FormControl>
                          <FormDescription>Número de série do equipamento (opcional)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Múltiplas fotos do equipamento */}
                    <div className="space-y-2">
                      <FormLabel>Fotos do Equipamento</FormLabel>
                      <MultipleImageUpload onImagesChange={setSelectedImages} maxImages={10} />
                      <FormDescription>Adicione múltiplas fotos do equipamento (opcional, máximo 10 fotos)</FormDescription>
                    </div>

                    {/* Checkbox para múltiplos equipamentos */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/30">
                      <Checkbox
                        id="has_multiple_items"
                        checked={hasMultipleItems}
                        onCheckedChange={(checked) => {
                          setHasMultipleItems(checked as boolean);
                          if (!checked) setAdditionalItems([]);
                        }}
                      />
                      <label
                        htmlFor="has_multiple_items"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Cliente trouxe múltiplos equipamentos/itens
                      </label>
                    </div>

                    {/* Seção de itens adicionais */}
                    {hasMultipleItems && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Equipamentos Adicionais</h4>
                            <p className="text-sm text-muted-foreground">Adicione outros equipamentos/periféricos que o cliente trouxe</p>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={addAdditionalItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Item
                          </Button>
                        </div>

                        {additionalItems.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum item adicional. Clique em "Adicionar Item" para começar.
                          </p>
                        )}

                        {additionalItems.map((item, index) => (
                          <div key={item.id} className="space-y-3 p-4 border rounded-lg bg-background">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm">Item {index + 1}</h5>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeAdditionalItem(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">Equipamento *</label>
                                <Input
                                  placeholder="Ex: Mouse, Teclado, Monitor"
                                  value={item.equipment}
                                  onChange={(e) => updateAdditionalItem(item.id, 'equipment', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Número de Série (S/N)</label>
                                <Input
                                  placeholder="Ex: SN123456"
                                  value={item.serial_number}
                                  onChange={(e) => updateAdditionalItem(item.id, 'serial_number', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Descrição/Observações</label>
                                <Textarea
                                  placeholder="Ex: Mouse sem fio preto, com defeito no botão direito"
                                  value={item.description}
                                  onChange={(e) => updateAdditionalItem(item.id, 'description', e.target.value)}
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="problem_description"
                      rules={{ required: 'Descrição do problema é obrigatória' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição do Problema</FormLabel>
                          <FormControl>
                            <SmartTextarea
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Descreva o problema relatado pelo cliente"
                              rows={5}
                              enableVoiceInput={true}
                            />
                          </FormControl>
                          <FormDescription>
                            Use as sugestões rápidas, digite livremente ou use o microfone para transcrever por voz. O sistema aprende com
                            suas descrições.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* AI Opening Assistant */}
                    <AIOpeningAssistant
                      problemDescription={form.watch('problem_description')}
                      equipment={form.watch('equipment')}
                      enabled={aiAssistantEnabled}
                      onToggle={setAiAssistantEnabled}
                      onApplyDescription={(description) => {
                        form.setValue('problem_description', description);
                      }}
                    />

                    {/* Web Search Assistant */}
                    <WebSearchAssistant
                      context="abertura_os"
                      placeholder="Ex: Samsung Galaxy S21 problemas comuns de bateria"
                      title="🔍 Buscar Informações Técnicas"
                      description="Busque especificações, problemas comuns e informações técnicas na web"
                      onApplyResult={(insights) => {
                        const currentDesc = form.watch('problem_description') || '';
                        let newDesc = currentDesc;

                        if (currentDesc.trim()) {
                          newDesc = `${currentDesc}\n\n📋 Referências:\n${insights}`;
                        } else {
                          newDesc = insights;
                        }

                        form.setValue('problem_description', newDesc);
                      }}
                    />

                    {/* Informação sobre data de previsão automática */}
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        ℹ️ A data de previsão será automaticamente definida para <strong>hoje + 3 dias</strong>. Você poderá ajustá-la
                        posteriormente na página de detalhes da ordem.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        secureTabStorage.removeItem(FORM_DRAFT_KEY);
                        secureTabStorage.removeItem('ORDER_DRAFT_FALLBACK');
                        secureTabStorage.removeItem(PENDING_CONFIRMATION_KEY);

                        setShowConfirmation(false);
                        setDialogOpen(false);

                        form.reset();
                        setIsNewClient(false);
                        setHasMultipleItems(false);
                        setAdditionalItems([]);
                        setSelectedImages([]);
                        setPendingOrderData(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating || showConfirmation}>
                      Revisar e Confirmar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg xl:text-xl">Filtros por Status</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="xl:hidden gap-1"
              >
                {filtersExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-xs">Menos</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="text-xs">Mais</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Filtros principais - Sempre visíveis */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="shrink-0 h-16 min-w-[64px] p-2 flex flex-col items-center justify-center gap-1.5"
              >
                <span className="text-2xl">📋</span>
                <span className="text-xs font-bold leading-none">{orders.length}</span>
              </Button>

              {(['received', 'analyzing', 'awaiting_approval', 'in_repair', 'ready_for_pickup', 'completed'] as OrderStatus[]).map(
                (status) => {
                  const config = statusConfig[status];
                  const count = orders.filter((o) => o.status === status).length;
                  const isActive = statusFilter === status;

                  return (
                    <Button
                      key={status}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="shrink-0 h-16 min-w-[64px] p-2 flex flex-col items-center justify-center gap-1.5"
                      style={
                        !isActive
                          ? {
                              borderColor: config.borderColor.includes('blue')
                                ? '#3b82f6'
                                : config.borderColor.includes('purple')
                                  ? '#a855f7'
                                  : config.borderColor.includes('yellow')
                                    ? '#eab308'
                                    : config.borderColor.includes('cyan')
                                      ? '#06b6d4'
                                      : config.borderColor.includes('red')
                                        ? '#ef4444'
                                        : config.borderColor.includes('orange')
                                          ? '#f97316'
                                          : config.borderColor.includes('amber')
                                            ? '#f59e0b'
                                            : config.borderColor.includes('green')
                                              ? '#22c55e'
                                              : config.borderColor.includes('sky')
                                                ? '#0ea5e9'
                                                : undefined,
                              borderWidth: '2px',
                            }
                          : undefined
                      }
                    >
                      <span className="text-2xl">{config.icon}</span>
                      <span className="text-xs font-bold leading-none">{count}</span>
                    </Button>
                  );
                }
              )}
            </div>

            {/* Filtros adicionais */}
            <div className={`${filtersExpanded ? 'block' : 'hidden xl:block'}`}>
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-2">
                {(Object.keys(statusConfig) as OrderStatus[]).map((status) => {
                  const config = statusConfig[status];
                  const count = orders.filter((o) => o.status === status).length;
                  const isActive = statusFilter === status;

                  const shortLabels: Record<OrderStatus, string> = {
                    received: 'Recebido',
                    analyzing: 'Análise',
                    awaiting_approval: 'Aguard. Aprov.',
                    approved: 'Aprovado',
                    not_approved: 'Cancelado',
                    in_repair: 'Reparo',
                    awaiting_parts: 'Aguard. Peças',
                    ready_for_pickup: 'Pronto',
                    completed: 'Finalizado',
                  };

                  return (
                    <Button
                      key={status}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="h-auto py-3 px-2 flex flex-col items-center justify-center gap-1.5 text-center"
                      style={
                        !isActive
                          ? {
                              borderColor: config.borderColor.includes('blue')
                                ? '#3b82f6'
                                : config.borderColor.includes('purple')
                                  ? '#a855f7'
                                  : config.borderColor.includes('yellow')
                                    ? '#eab308'
                                    : config.borderColor.includes('cyan')
                                      ? '#06b6d4'
                                      : config.borderColor.includes('red')
                                        ? '#ef4444'
                                        : config.borderColor.includes('orange')
                                          ? '#f97316'
                                          : config.borderColor.includes('amber')
                                            ? '#f59e0b'
                                            : config.borderColor.includes('green')
                                              ? '#22c55e'
                                              : config.borderColor.includes('sky')
                                                ? '#0ea5e9'
                                                : undefined,
                              borderWidth: '2px',
                            }
                          : undefined
                      }
                    >
                      <span className="text-xl">{config.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{shortLabels[status]}</span>
                      <span className="text-xs font-bold opacity-70">{count}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barra de busca e lista de ordens */}
        <Card>
          <CardHeader>
            <div className="flex flex-col xl:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, equipamento ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {statusFilter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')} className="gap-2">
                  <X className="h-4 w-4" />
                  Limpar Filtro
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma ordem encontrada</p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium">OS #{order.order_number}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{order.equipment}</p>
                      <p className="text-sm text-muted-foreground">Cliente: {order.client.name || order.client.email}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Confirmation Dialog */}
      <OrderConfirmationDialog
        open={showConfirmation}
        onOpenChange={handleConfirmationOpenChange}
        data={{
          client: pendingOrderData?.client_id ? clients.find((c) => c.id === pendingOrderData.client_id) : undefined,
          isNewClient,
          newClientData: isNewClient
            ? {
                first_name: pendingOrderData?.new_client_first_name || '',
                last_name: pendingOrderData?.new_client_last_name || '',
                email: pendingOrderData?.new_client_email || '',
                phone: pendingOrderData?.new_client_phone || '',
              }
            : undefined,
          equipment: pendingOrderData?.equipment || '',
          serial_number: pendingOrderData?.serial_number,
          problem_description: pendingOrderData?.problem_description || '',
          equipment_photo_url: pendingOrderData?.equipment_photo_url,
          hasMultipleItems,
          additionalItems,
          selectedImages,
        }}
        onConfirm={handleConfirmOrder}
        onCancel={handleConfirmationCancel}
        loading={creating}
      />
    </AdminLayout>
  );
}
