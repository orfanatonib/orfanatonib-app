import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllInboxNotificationsRead, markInboxNotificationRead } from '../api';
import { notificationKeys } from '../queryKeys';

/**
 * Marcar como lido. Sempre reconsulta resumo e lista ao terminar (sucesso ou erro), então o contador nunca
 * fica errado. Falha não gera toast global: o aviso continua na lista e o usuário pode tentar de novo.
 */
export function useInboxMutations(userId: string | null) {
  const client = useQueryClient();
  const refresh = () => {
    if (!userId) return;
    void client.invalidateQueries({ queryKey: notificationKeys.summary(userId) });
    void client.invalidateQueries({ queryKey: notificationKeys.lists(userId) });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => markInboxNotificationRead(id),
    onSettled: refresh,
  });
  const markAllRead = useMutation({
    mutationFn: () => markAllInboxNotificationsRead(),
    onSettled: refresh,
  });
  return { markRead, markAllRead };
}
