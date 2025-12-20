import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteVisitMaterial, listVisitMaterials, setCurrentMaterial, ListVisitMaterialsParams } from './api';
import { VisitMaterialPageData } from '@/store/slices/visit-material/visitMaterialSlice';

export function useVisitMaterials() {
  const [materials, setMaterials] = useState<VisitMaterialPageData[]>([]);
  const [search, setSearch] = useState('');
  const [testament, setTestament] = useState<'OLD_TESTAMENT' | 'NEW_TESTAMENT' | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');
  const isInitialMount = useRef(true);

  const debounceRef = useRef<number | null>(null);

  const fetchAll = useCallback(async (params?: ListVisitMaterialsParams) => {
    setLoading(true);
    setError('');
    setIsFiltering(true);
    try {
      const data = await listVisitMaterials(params);
      setMaterials(data);
    } catch (e) {
      setError('Erro ao buscar materiais de visita');
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchAll();
    }
  }, [fetchAll]);

  useEffect(() => {
    if (isInitialMount.current) return;
    
    setIsFiltering(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const params: ListVisitMaterialsParams = {};
      
      if (testament) {
        params.testament = testament;
      }
      
      if (search.trim()) {
        params.searchString = search.trim();
      }
      
      fetchAll(params);
    }, 300);
    
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search, testament, fetchAll]);

  const remove = useCallback(async (id: string) => {
    await deleteVisitMaterial(id);
    const params: ListVisitMaterialsParams = {};
    if (testament) params.testament = testament;
    if (search.trim()) params.searchString = search.trim();
    await fetchAll(params);
  }, [fetchAll, testament, search]);

  const markAsCurrent = useCallback(async (id: string) => {
    await setCurrentMaterial(id);
    const params: ListVisitMaterialsParams = {};
    if (testament) params.testament = testament;
    if (search.trim()) params.searchString = search.trim();
    await fetchAll(params);
  }, [fetchAll, testament, search]);

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
  };
}

