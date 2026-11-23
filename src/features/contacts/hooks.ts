import { useCallback, useState } from 'react';
import { apiDeleteContact, apiMarkAsRead } from './api';
import { CONTACTS_LABELS } from './constants';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

/** Excluir e marcar como lido; depois de cada ação a lista é recarregada pelo chamador. */
export function useContactMutations(refresh: () => Promise<void> | void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(
    async (action: () => Promise<void>, fallback: string) => {
      setBusy(true);
      setError('');
      try {
        await action();
        await refresh();
      } catch (e: unknown) {
        setError(getApiErrorMessage(e, fallback));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => run(() => apiDeleteContact(id), CONTACTS_LABELS.DELETE_ERROR),
    [run],
  );
  const markAsRead = useCallback(
    (id: string) => run(() => apiMarkAsRead(id), CONTACTS_LABELS.MARK_ERROR),
    [run],
  );

  return { busy, error, remove, markAsRead };
}
