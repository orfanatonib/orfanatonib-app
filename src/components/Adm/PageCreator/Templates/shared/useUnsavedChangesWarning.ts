import { useEffect, useId } from 'react';
import { clearFormDirty, markFormDirty } from '@/utils/unsavedChanges';

/** Anuncia o formulário sujo ao registro global e avisa ao fechar a aba. */
export function useUnsavedChangesWarning(enabled: boolean, isDirty: boolean): void {
  const formId = useId();

  useEffect(() => {
    if (!enabled || !isDirty) return undefined;
    markFormDirty(formId);
    const preventLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventLeave);
    return () => {
      clearFormDirty(formId);
      window.removeEventListener('beforeunload', preventLeave);
    };
  }, [enabled, isDirty, formId]);
}
