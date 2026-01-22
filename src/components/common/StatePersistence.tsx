import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { safeStorage } from '@/utils/safeStorage';

/**
 * Componente para prevenir perda de estado quando o app é minimizado no mobile
 * Salva a rota atual e scroll position automaticamente
 */
export function StatePersistence({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Restaurar posição de scroll e rota ao montar
    const savedRoute = safeStorage.getItem('app_last_route');
    const savedScrollY = safeStorage.getItem('app_scroll_y');

    if (savedRoute && savedRoute !== location.pathname) {
      // Restaurar rota anterior
      navigate(savedRoute, { replace: true });
    }

    if (savedScrollY) {
      // Restaurar posição de scroll após um pequeno delay
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollY, 10));
      }, 100);
    }

    // Limpar dados salvos após restaurar
    safeStorage.removeItem('app_last_route');
    safeStorage.removeItem('app_scroll_y');
  }, []);

  useEffect(() => {
    // Salvar rota atual quando mudar
    const saveCurrentState = () => {
      safeStorage.setItem('app_last_route', location.pathname);
      safeStorage.setItem('app_scroll_y', window.scrollY.toString());
    };

    // Salvar estado quando a página ficar invisível (minimizar app)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentState();
      }
    };

    // Salvar estado antes da página ser descarregada
    const handleBeforeUnload = () => {
      saveCurrentState();
    };

    // Salvar estado periodicamente (a cada 5 segundos)
    const intervalId = setInterval(saveCurrentState, 5000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [location.pathname]);

  return <>{children}</>;
}
