import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { DOCUMENTS_ENDPOINT } from './constants';
import type { DocumentItem } from './types';

/** Página de documentos filtrada, ordenada e paginada no servidor. */
export const fetchDocumentsPage: AdminListFetcher<DocumentItem> = (params, signal) =>
  fetchAdminPage<DocumentItem>(DOCUMENTS_ENDPOINT, params, signal);

export async function getDocument(id: string) {
  const { data } = await api.get<DocumentItem>(`${DOCUMENTS_ENDPOINT}/${id}`);
  return data;
}

export async function createDocument(formData: FormData) {
  await api.post(DOCUMENTS_ENDPOINT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function updateDocument(id: string, formData: FormData) {
  await api.patch(`${DOCUMENTS_ENDPOINT}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function deleteDocument(id: string) {
  await api.delete(`${DOCUMENTS_ENDPOINT}/${id}`);
}
