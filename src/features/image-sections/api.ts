import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import type { ImageSectionPendingCount, MyImageSection } from './types';
import {
  IMAGE_SECTIONS_ENDPOINT,
  IMAGE_SECTIONS_PENDING_COUNT_ENDPOINT,
  SHELTER_UPLOAD_TIMEOUT_MS,
} from './constants';

/** Fila de moderação filtrada, ordenada e paginada no servidor. */
export const fetchImageSectionsPage: AdminListFetcher<SectionData> = (params, signal) =>
  fetchAdminPage<SectionData>(IMAGE_SECTIONS_ENDPOINT, params, signal);

export async function deleteImageSection(id: string): Promise<void> {
  await api.delete(`${IMAGE_SECTIONS_ENDPOINT}/${id}`);
}

/** Envio de fotos e vídeo de um abrigo (multipart `sectionData` + arquivos); fica na fila de moderação. */
export async function submitImageSection(formData: FormData): Promise<void> {
  await api.post(IMAGE_SECTIONS_ENDPOINT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: SHELTER_UPLOAD_TIMEOUT_MS,
  });
}

/** Revisão do admin: grava os ajustes e (com `public: true`) leva a publicação à galeria do feed. */
export async function updateImageSection(id: string, formData: FormData): Promise<void> {
  await api.patch(`${IMAGE_SECTIONS_ENDPOINT}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: SHELTER_UPLOAD_TIMEOUT_MS,
  });
}

/** Reprova a publicação com motivo (o autor recebe na tela e por e-mail). */
export async function rejectImageSection(id: string, reason: string): Promise<void> {
  await api.patch(`${IMAGE_SECTIONS_ENDPOINT}/${id}/reject`, { reason });
}

/** Publicações do próprio autor: status e motivo da reprovação. */
export async function listMyImageSections(): Promise<MyImageSection[]> {
  const { data } = await api.get<MyImageSection[]>(`${IMAGE_SECTIONS_ENDPOINT}/mine`);
  return data;
}

/** Quantas publicações aguardam revisão (só admin; alimenta o selo do painel). */
export async function getImageSectionsPendingCount(signal?: AbortSignal): Promise<ImageSectionPendingCount> {
  const { data } = await api.get<ImageSectionPendingCount>(IMAGE_SECTIONS_PENDING_COUNT_ENDPOINT, {
    signal,
    skipGlobalError: true,
  });
  return data;
}
