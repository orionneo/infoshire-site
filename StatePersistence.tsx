import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Componente para prevenir perda de estado quando o app é minimizado no mobile
 * Salva a rota atual e scroll position automaticamente
 */
export function StatePersistence({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Restaurar posição de scroll e rota ao montar
    const savedRoute = sessionStorage.getItem('app_last_route');
    const savedScrollY = sessionStorage.getItem('app_scroll_y');

    if (savedRoute && savedRoute !== location.pathname) {
      // Restaurar rota anterior
      navigate(savedRoute, { replace: true });
    }

    if (savedScrollY) {
      // Restaurar posição de scroll imediatamente
      window.scrollTo(0, parseInt(savedScrollY, 10));
    }

    // Limpar dados salvos após restaurar
    sessionStorage.removeItem('app_last_route');
    sessionStorage.removeItem('app_scroll_y');
  }, []);

  useEffect(() => {
    // Salvar rota atual e posição de scroll apenas quando a rota muda
    sessionStorage.setItem('app_last_route', location.pathname);
    sessionStorage.setItem('app_scroll_y', window.scrollY.toString());
  }, [location.pathname]);

  return <>{children}</>;
}
