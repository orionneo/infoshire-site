import { useEffect } from 'react';
import { safeLocalStorage, safeStorage } from '@/utils/safeStorage';

/**
 * Hook para prevenir perda de estado quando o app é minimizado no mobile
 * Salva o estado atual no sessionStorage quando a página fica invisível
 * e restaura quando volta a ficar visível
 */
export function usePreventStateLoss<T>(
  key: string,
  state: T,
  setState: (state: T) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    // Tentar restaurar estado salvo ao montar o componente
    const savedState = safeStorage.getItem(`state_${key}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(parsed);
        // Limpar após restaurar
        safeStorage.removeItem(`state_${key}`);
      } catch (error) {
        console.error('Erro ao restaurar estado:', error);
      }
    }

    // Salvar estado quando a página ficar invisível
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página está sendo minimizada/escondida
        try {
          safeStorage.setItem(`state_${key}`, JSON.stringify(state));
        } catch (error) {
          console.error('Erro ao salvar estado:', error);
        }
      }
    };

    // Salvar estado antes da página ser descarregada
    const handleBeforeUnload = () => {
      try {
        safeStorage.setItem(`state_${key}`, JSON.stringify(state));
      } catch (error) {
        console.error('Erro ao salvar estado:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [key, state, setState, enabled]);
}

/**
 * Hook simplificado para persistir formulários automaticamente
 * Usa localStorage para persistência entre sessões
 */
export function useFormPersistence<T extends Record<string, any>>(
  formKey: string,
  defaultValues: T
): [T, (values: T) => void, () => void] {
  const storageKey = `form_${formKey}`;

  // Tentar carregar valores salvos
  const getSavedValues = (): T => {
    try {
      const saved = safeLocalStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultValues, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erro ao carregar formulário salvo:', error);
    }
    return defaultValues;
  };

  // Salvar valores
  const saveValues = (values: T) => {
    try {
      safeLocalStorage.setItem(storageKey, JSON.stringify(values));
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
    }
  };

  // Limpar valores salvos
  const clearSavedValues = () => {
    try {
      safeLocalStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Erro ao limpar formulário salvo:', error);
    }
  };

  return [getSavedValues(), saveValues, clearSavedValues];
}
