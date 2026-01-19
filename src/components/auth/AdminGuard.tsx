import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/db/supabase';

type GuardState =
  | { status: 'loading' }
  | { status: 'allowed' }
  | { status: 'denied'; reason: 'not_logged' | 'not_admin' };

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<GuardState>({ status: 'loading' });

  const redirectTo = useMemo(() => {
    // volta para login e mantém o caminho pra redirecionar depois se quiser
    return `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  }, [location.pathname, location.search]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1) sessão
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const session = sessionData.session;
        if (!session?.user?.id) {
          if (!cancelled) setState({ status: 'denied', reason: 'not_logged' });
          return;
        }

        // 2) checa role (ajuste o campo conforme seu schema)
        // Opções comuns: profiles.role, profiles.is_admin, profiles.user_role
        const userId = session.user.id;

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role,is_admin')
          .eq('id', userId)
          .maybeSingle();

        // Se a tabela/colunas forem diferentes, isso pode dar erro:
        // Nesse caso, você troca o select pelas colunas reais.
        if (profileErr) throw profileErr;

        const isAdmin =
          profile?.is_admin === true ||
          (typeof profile?.role === 'string' && profile.role.toLowerCase() === 'admin');

        if (!cancelled) {
          setState(isAdmin ? { status: 'allowed' } : { status: 'denied', reason: 'not_admin' });
        }
      } catch (e) {
        // Se der qualquer erro, por segurança bloqueia admin
        if (!cancelled) setState({ status: 'denied', reason: 'not_admin' });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm opacity-80">
        Verificando permissões...
      </div>
    );
  }

  if (state.status === 'denied') {
    // não logado -> login
    if (state.reason === 'not_logged') {
      return <Navigate to={redirectTo} replace />;
    }
    // logado mas não admin -> manda pro /client (ou home)
    return <Navigate to="/client" replace />;
  }

  return <>{children}</>;
}
