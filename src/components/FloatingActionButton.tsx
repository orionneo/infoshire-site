import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  DollarSign,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';

async function panicReset() {
  try {
    // 1) Limpa Cache Storage (onde o SW guarda assets/requests)
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // 2) Unregister Service Workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    // 3) Limpa storages
    try {
      localStorage.clear();
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}

    // 4) Reload forte (força recarregar e evita state/cache preso)
    const url = new URL(window.location.href);
    url.searchParams.set('__panic', String(Date.now()));
    window.location.replace(url.toString());
  } catch (e) {
    console.warn('panicReset falhou, tentando reload simples:', e);
    window.location.reload();
  }
}

export function FloatingActionButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const quickActions: Array<{
    label: string;
    icon: any;
    to?: string;
    action?: string;
    color: string;
    kind?: 'nav' | 'panic';
  }> = [
    { label: 'Nova Ordem', icon: Package, to: '/admin/orders', action: 'new-order', color: 'text-blue-500', kind: 'nav' },
    { label: 'Buscar Garantia', icon: Search, to: '/admin/warranty-search', color: 'text-green-500', kind: 'nav' },
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin', color: 'text-purple-500', kind: 'nav' },
    { label: 'Clientes', icon: Users, to: '/admin/clients', color: 'text-orange-500', kind: 'nav' },
    { label: 'Financeiro', icon: DollarSign, to: '/admin/financial', color: 'text-emerald-500', kind: 'nav' },
    { label: 'Garantias', icon: Shield, to: '/admin/warranty-list', color: 'text-cyan-500', kind: 'nav' },

    // ✅ PANIC BUTTON (reset forte do PWA/web)
    { label: 'Panic Button (Reset)', icon: ShieldAlert, color: 'text-red-600', kind: 'panic' },
  ];

  const handleAction = async (item: (typeof quickActions)[number]) => {
    try {
      if (item.kind === 'panic') {
        setOpen(false);

        const ok = window.confirm(
          'Panic Button: isso vai limpar caches do app e recarregar.\n\nUse apenas se a tela estiver travada em loading.\n\nDeseja continuar?'
        );
        if (!ok) return;

        await panicReset();
        return;
      }

      if (item.to) {
        navigate(item.to, { state: { openDialog: item.action === 'new-order' } });
      }
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="lg:hidden fixed bottom-6 right-6 z-40">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="lg" className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all">
            <Plus className={`h-6 w-6 transition-transform ${open ? 'rotate-45' : ''}`} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 mb-2">
          <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.label}
                onClick={() => void handleAction(action)}
                className={`cursor-pointer py-3 ${action.kind === 'panic' ? 'text-red-600 focus:text-red-600' : ''}`}
              >
                <Icon className={`h-5 w-5 mr-3 ${action.color}`} />
                <span className="font-medium">{action.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default FloatingActionButton;