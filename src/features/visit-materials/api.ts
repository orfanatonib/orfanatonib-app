import api from '@/config/axiosConfig';
import { VisitMaterialPageData } from '@/store/slices/visit-material/visitMaterialSlice';

export interface ListVisitMaterialsParams {
  testament?: 'OLD_TESTAMENT' | 'NEW_TESTAMENT';
  searchString?: string;
}

export async function listVisitMaterials(
  params?: ListVisitMaterialsParams,
): Promise<VisitMaterialPageData[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.testament) {
    queryParams.append('testament', params.testament);
  }
  
  if (params?.searchString) {
    queryParams.append('searchString', params.searchString);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/visit-material-pages?${queryString}` : '/visit-material-pages';
  
  const { data } = await api.get<VisitMaterialPageData[]>(url);
  return [...data].sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
  );
}

export async function deleteVisitMaterial(id: string): Promise<void> {
  await api.delete(`/visit-material-pages/${id}`);
}

export async function setCurrentMaterial(id: string): Promise<void> {
  await api.post(`/visit-material-pages/current-material/${id}`);
}

export async function getCurrentMaterial(): Promise<VisitMaterialPageData | null> {
  const { data } = await api.get<VisitMaterialPageData | null>('/visit-material-pages/current-material');
  return data;
}

export async function getVisitMaterialById(id: string): Promise<VisitMaterialPageData> {
  const { data } = await api.get<VisitMaterialPageData>(`/visit-material-pages/${id}`);
  return data;
}

