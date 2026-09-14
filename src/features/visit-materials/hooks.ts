import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteVisitMaterial,
  getVisitMaterialById,
  listVisitMaterials,
  setCurrentMaterial,
} from './api';
import {
  VISIT_MATERIAL_FILTER_DEBOUNCE_MS,
  VISIT_MATERIAL_MESSAGES,
} from './constants';
import { visitMaterialErrorMessage } from './errors';
import {
  TestamentType,
  VisitMaterialMutation,
  VisitMaterialPageResponseDto,
} from './types';
import { buildVisitMaterialQuery } from './utils';

export function useVisitMaterials() {
  const [materials, setMaterials] = useState<VisitMaterialPageResponseDto[]>([]);
  const [search, setSearch] = useState('');
  const [testament, setTestament] = useState<TestamentType | undefined>();
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');
  const [pendingMutation, setPendingMutation] =
    useState<VisitMaterialMutation | null>(null);
  const latestRequest = useRef(0);
  const hasLoaded = useRef(false);

  const fetchAll = useCallback(
    async (nextSearch = search, nextTestament = testament): Promise<void> => {
      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;
      setError('');
      if (hasLoaded.current) setIsFiltering(true);
      else setLoading(true);

      try {
        const data = await listVisitMaterials(
          buildVisitMaterialQuery(nextSearch, nextTestament),
        );
        if (requestId === latestRequest.current) setMaterials(data);
      } catch (caught: unknown) {
        if (requestId === latestRequest.current) {
          setError(
            visitMaterialErrorMessage(
              caught,
              VISIT_MATERIAL_MESSAGES.LIST_ERROR,
            ),
          );
        }
      } finally {
        if (requestId === latestRequest.current) {
          hasLoaded.current = true;
          setLoading(false);
          setIsFiltering(false);
        }
      }
    },
    [search, testament],
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void fetchAll(search, testament),
      hasLoaded.current ? VISIT_MATERIAL_FILTER_DEBOUNCE_MS : 0,
    );
    return () => window.clearTimeout(timeout);
  }, [fetchAll, search, testament]);

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (pendingMutation) return false;
      setPendingMutation(VisitMaterialMutation.DELETE);
      setError('');
      try {
        await deleteVisitMaterial({ id });
        await fetchAll();
        return true;
      } catch (caught: unknown) {
        setError(
          visitMaterialErrorMessage(
            caught,
            VISIT_MATERIAL_MESSAGES.DELETE_ERROR,
          ),
        );
        return false;
      } finally {
        setPendingMutation(null);
      }
    },
    [fetchAll, pendingMutation],
  );

  const markAsCurrent = useCallback(
    async (id: string): Promise<boolean> => {
      if (pendingMutation) return false;
      setPendingMutation(VisitMaterialMutation.SET_CURRENT);
      setError('');
      try {
        await setCurrentMaterial({ id });
        await fetchAll();
        return true;
      } catch (caught: unknown) {
        setError(
          visitMaterialErrorMessage(
            caught,
            VISIT_MATERIAL_MESSAGES.SET_CURRENT_ERROR,
          ),
        );
        return false;
      } finally {
        setPendingMutation(null);
      }
    },
    [fetchAll, pendingMutation],
  );

  return {
    materials,
    search,
    setSearch,
    testament,
    setTestament,
    loading,
    isFiltering,
    error,
    setError,
    fetchAll,
    remove,
    markAsCurrent,
    pendingMutation,
  };
}

export function useVisitMaterial(id: string) {
  const [material, setMaterial] =
    useState<VisitMaterialPageResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMaterial = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setMaterial(await getVisitMaterialById({ id }));
    } catch (caught: unknown) {
      setMaterial(null);
      setError(
        visitMaterialErrorMessage(
          caught,
          VISIT_MATERIAL_MESSAGES.DETAIL_ERROR,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchMaterial();
  }, [fetchMaterial]);

  return { material, loading, error, fetchMaterial };
}
