import api from '@/config/axiosConfig';
import { NOTIFICATIONS_ENDPOINT } from './constants';
import type {
  InboxListQuery,
  InboxNotificationDto,
  InboxNotificationsPageDto,
  InboxReadAllDto,
  InboxSummaryDto,
} from './types';

/*
 * A central mostra os próprios erros (estado de erro e "Tentar novamente"); o polling não pode gerar um
 * toast global a cada 30 segundos. Sessão expirada continua passando pelo refresh único do cliente Axios.
 */

export async function fetchInboxSummary(signal?: AbortSignal): Promise<InboxSummaryDto> {
  const { data } = await api.get<InboxSummaryDto>(`${NOTIFICATIONS_ENDPOINT}/summary`, {
    signal,
    skipGlobalError: true,
  });
  return data;
}

export async function fetchInboxNotifications(
  params: InboxListQuery,
  signal?: AbortSignal,
): Promise<InboxNotificationsPageDto> {
  const { data } = await api.get<InboxNotificationsPageDto>(NOTIFICATIONS_ENDPOINT, {
    params,
    signal,
    skipGlobalError: true,
  });
  return data;
}

export async function markInboxNotificationRead(id: string): Promise<InboxNotificationDto> {
  const { data } = await api.patch<InboxNotificationDto>(`${NOTIFICATIONS_ENDPOINT}/${id}/read`, undefined, {
    skipGlobalError: true,
  });
  return data;
}

export async function markAllInboxNotificationsRead(): Promise<InboxReadAllDto> {
  const { data } = await api.patch<InboxReadAllDto>(`${NOTIFICATIONS_ENDPOINT}/read-all`, undefined, {
    skipGlobalError: true,
  });
  return data;
}
