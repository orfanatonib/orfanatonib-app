import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { FeedbackData } from '@/store/slices/feedback/feedbackSlice';
import { FEEDBACKS_ENDPOINT } from './constants';
import type { SiteFeedbackPayload } from './payload';

/** Página de feedbacks filtrada, ordenada e paginada no servidor. */
export const fetchFeedbacksPage: AdminListFetcher<FeedbackData> = (params, signal) =>
  fetchAdminPage<FeedbackData>(FEEDBACKS_ENDPOINT, params, signal);

export async function apiDeleteFeedback(id: string): Promise<void> {
  await api.delete(`${FEEDBACKS_ENDPOINT}/${id}`);
}

export async function apiMarkAsRead(id: string): Promise<FeedbackData> {
  const { data } = await api.patch<FeedbackData>(`${FEEDBACKS_ENDPOINT}/${id}/read`);
  return data;
}

/** Envio de uma avaliação por qualquer pessoa autenticada; fica na fila de moderação. */
export async function apiSubmitFeedback(payload: SiteFeedbackPayload): Promise<FeedbackData> {
  const { data } = await api.post<FeedbackData>(FEEDBACKS_ENDPOINT, payload);
  return data;
}
