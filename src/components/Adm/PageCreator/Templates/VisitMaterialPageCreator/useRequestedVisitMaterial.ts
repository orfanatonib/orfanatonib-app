import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/slices';
import { setVisitMaterialData } from '@/store/slices/visit-material/visitMaterialSlice';
import { getVisitMaterialById } from '@/features/visit-materials/api';
import { VISIT_MATERIAL_MESSAGES } from '@/features/visit-materials/constants';
import { visitMaterialErrorMessage } from '@/features/visit-materials/errors';

interface Params {
  fromTemplatePage: boolean;
  requestedMaterialId: string | null;
  loadedMaterialId?: string;
}

/** Carrega pelo `?id=` o material a editar quando ele ainda não está no store. */
export function useRequestedVisitMaterial({ fromTemplatePage, requestedMaterialId, loadedMaterialId }: Params) {
  const dispatch = useDispatch<AppDispatch>();
  const [initialLoading, setInitialLoading] = useState(false);
  const [initialError, setInitialError] = useState('');

  useEffect(() => {
    if (fromTemplatePage || !requestedMaterialId || loadedMaterialId === requestedMaterialId) return;

    let active = true;
    setInitialLoading(true);
    setInitialError('');
    void getVisitMaterialById({ id: requestedMaterialId })
      .then((material) => {
        if (active) dispatch(setVisitMaterialData(material));
      })
      .catch((caught: unknown) => {
        if (active) {
          setInitialError(visitMaterialErrorMessage(caught, VISIT_MATERIAL_MESSAGES.DETAIL_ERROR));
        }
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, fromTemplatePage, requestedMaterialId, loadedMaterialId]);

  return { initialLoading, initialError };
}
