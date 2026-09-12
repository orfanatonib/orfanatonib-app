import api from '@/config/axiosConfig';
import { IdeasPage, IdeasSection } from './types';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** Ideias ainda não publicadas em nenhuma página. */
export async function listIdeasSections(): Promise<IdeasSection[]> {
  const { data } = await api.get<IdeasSection[]>('/ideas-sections');
  return data;
}

export async function getIdeasSection(id: string): Promise<IdeasSection> {
  const { data } = await api.get<IdeasSection>(`/ideas-sections/${id}`);
  return data;
}

export async function listIdeasPages(): Promise<IdeasPage[]> {
  const { data } = await api.get<IdeasPage[]>('/ideas-pages');
  return data;
}

export async function createIdeasSection(
  payload: FormData,
): Promise<IdeasSection> {
  const { data } = await api.post<IdeasSection>(
    '/ideas-sections',
    payload,
    MULTIPART,
  );
  return data;
}

export async function updateIdeasSection(
  sectionId: string,
  payload: FormData,
): Promise<IdeasSection> {
  const { data } = await api.patch<IdeasSection>(
    `/ideas-sections/${sectionId}`,
    payload,
    MULTIPART,
  );
  return data;
}

/**
 * Edita a seção e a publica numa página no mesmo passo. O nome anterior era
 * `updateIdeasSection`, o que escondia que a chamada **vincula** a seção —
 * operação que só acontece uma vez e responde 409 na segunda.
 */
export async function attachIdeasSectionToPage(
  sectionId: string,
  pageId: string,
  payload: FormData,
): Promise<IdeasSection> {
  const { data } = await api.patch<IdeasSection>(
    `/ideas-sections/${sectionId}/attach/${pageId}`,
    payload,
    MULTIPART,
  );
  return data;
}

export async function deleteIdeasSection(id: string): Promise<void> {
  await api.delete(`/ideas-sections/${id}`);
}
