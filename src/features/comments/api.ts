import api from "@/config/axiosConfig";
import { CommentData } from "store/slices/comment/commentsSlice";

export async function apiGetComments() {
  const { data } = await api.get<CommentData[]>("/comments");
  return data;
}

/** Depoimentos já publicados (rota pública, sem perfil). */
export async function apiGetPublishedComments() {
  const { data } = await api.get<CommentData[]>("/comments/published");
  return data;
}

/** Envio de um depoimento por qualquer pessoa autenticada; fica na fila de moderação. */
export async function apiSubmitComment(payload: {
  name: string;
  comment: string;
  shelter: string;
  neighborhood: string;
}) {
  await api.post("/comments", payload);
}

export async function apiDeleteComment(id: string) {
  await api.delete(`/comments/${id}`);
}

export async function apiPublishComment(c: CommentData) {
  await api.put(`/comments/${c.id}`, {
    name: c.name,
    comment: c.comment,
    shelter: c.shelter,
    neighborhood: c.neighborhood,
    published: true,
  });
}

export async function apiUpdateComment(c: CommentData, payload: {
  name: string;
  comment: string;
  shelter: string;
  neighborhood: string;
  published?: boolean; 
}) {
  await api.put(`/comments/${c.id}`, {
    name: payload.name,
    comment: payload.comment,
    shelter: payload.shelter,
    neighborhood: payload.neighborhood,
    published: payload.published ?? true,
  });
}
