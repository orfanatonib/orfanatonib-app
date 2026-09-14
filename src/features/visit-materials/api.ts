import api from '@/config/axiosConfig';
import {
  ListVisitMaterialsQueryDto,
  VisitMaterialIdParamsDto,
  VisitMaterialPageResponseDto,
} from './types';
import {
  VISIT_MATERIAL_CURRENT_ENDPOINT,
  VISIT_MATERIAL_ENDPOINT,
} from './constants';

export async function listVisitMaterials(
  params: ListVisitMaterialsQueryDto = {},
): Promise<VisitMaterialPageResponseDto[]> {
  const { data } = await api.get<VisitMaterialPageResponseDto[]>(
    VISIT_MATERIAL_ENDPOINT,
    { params },
  );
  return data ?? [];
}

export async function createVisitMaterial(
  payload: FormData,
): Promise<VisitMaterialPageResponseDto> {
  const { data } = await api.post<VisitMaterialPageResponseDto>(
    VISIT_MATERIAL_ENDPOINT,
    payload,
  );
  return data;
}

export async function updateVisitMaterial(
  params: VisitMaterialIdParamsDto,
  payload: FormData,
): Promise<VisitMaterialPageResponseDto> {
  const { data } = await api.patch<VisitMaterialPageResponseDto>(
    `${VISIT_MATERIAL_ENDPOINT}/${params.id}`,
    payload,
  );
  return data;
}

export async function deleteVisitMaterial(
  params: VisitMaterialIdParamsDto,
): Promise<void> {
  await api.delete(`${VISIT_MATERIAL_ENDPOINT}/${params.id}`);
}

export async function setCurrentMaterial(
  params: VisitMaterialIdParamsDto,
): Promise<VisitMaterialPageResponseDto> {
  const { data } = await api.post<VisitMaterialPageResponseDto>(
    `${VISIT_MATERIAL_CURRENT_ENDPOINT}/${params.id}`,
  );
  return data;
}

export async function getCurrentMaterial(): Promise<VisitMaterialPageResponseDto | null> {
  const { data } = await api.get<VisitMaterialPageResponseDto | null>(
    VISIT_MATERIAL_CURRENT_ENDPOINT,
  );
  return data;
}

export async function getVisitMaterialById(
  params: VisitMaterialIdParamsDto,
): Promise<VisitMaterialPageResponseDto> {
  const { data } = await api.get<VisitMaterialPageResponseDto>(
    `${VISIT_MATERIAL_ENDPOINT}/${params.id}`,
  );
  return data;
}
