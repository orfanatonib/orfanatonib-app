import api from "@/config/axiosConfig";
import { FeedbackData } from "@/store/slices/feedback/feedbackSlice";
import type { SiteFeedbackPayload } from "./payload";

export async function apiListFeedbacks(): Promise<FeedbackData[]> {
  const { data } = await api.get<FeedbackData[]>("/site-feedbacks");
  return Array.isArray(data) ? data : [];
}

export async function apiDeleteFeedback(id: string): Promise<void> {
  await api.delete(`/site-feedbacks/${id}`);
}

export async function apiMarkAsRead(id: string): Promise<FeedbackData> {
  const { data } = await api.patch<FeedbackData>(`/site-feedbacks/${id}/read`);
  return data;
}

/** Envio de uma avaliação por qualquer pessoa autenticada; fica na fila de moderação. */
export async function apiSubmitFeedback(payload: SiteFeedbackPayload): Promise<FeedbackData> {
  const { data } = await api.post<FeedbackData>("/site-feedbacks", payload);
  return data;
}
