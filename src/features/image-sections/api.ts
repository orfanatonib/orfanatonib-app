import api from '@/config/axiosConfig';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';

export async function listImageSections(): Promise<SectionData[]> {
  const { data } = await api.get('/image-sections');
  return data as SectionData[];
}

export async function deleteImageSection(id: string): Promise<void> {
  await api.delete(`/image-sections/${id}`);
}

/** Envio das fotos de um abrigo (multipart `sectionData` + arquivos); fica na fila de moderação. */
export async function submitImageSection(formData: FormData): Promise<void> {
  await api.post('/image-sections', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
