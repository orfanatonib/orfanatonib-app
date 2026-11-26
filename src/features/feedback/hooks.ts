import { useCallback, useState } from 'react';
import { apiDeleteFeedback, apiMarkAsRead } from './api';
import { FEEDBACKS_LABELS } from './constants';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

/** Excluir e marcar como lido; depois de cada ação a lista é recarregada pelo chamador. */
export function useFeedbackMutations(refresh: () => Promise<void> | void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(
    async (action: () => Promise<unknown>, fallback: string) => {
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

  const deleteOne = useCallback(
    (id: string) => run(() => apiDeleteFeedback(id), FEEDBACKS_LABELS.DELETE_ERROR),
    [run],
  );
  const markAsRead = useCallback(
    (id: string) => run(() => apiMarkAsRead(id), FEEDBACKS_LABELS.MARK_ERROR),
    [run],
  );

  return { busy, error, deleteOne, markAsRead };
}
