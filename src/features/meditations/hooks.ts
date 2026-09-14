import { useCallback, useEffect, useState } from 'react';
import type { MeditationData } from '@/store/slices/meditation/meditationSlice';
import { listMeditations, deleteMeditation } from './api';

export function formatPtBrDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-BR');
}

export function useMeditationsList() {
  const [items, setItems] = useState<MeditationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async (querySearch?: string) => {
    setLoading(true);
    setFiltering(true);
    setError('');
    try {
      const data = await listMeditations(querySearch);
      setItems(data);
    } catch {
      setError('Erro ao buscar meditações.');
    } finally {
      setLoading(false);
      setFiltering(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const remove = useCallback(async (m: MeditationData) => {
    setLoading(true);
    try {
      await deleteMeditation(m.id);
      await load(search);
    } catch {
      setError('Erro ao deletar meditação.');
    } finally {
      setLoading(false);
    }
  }, [load, search]);

  return {
    meditations: items,
    allMeditations: items,
    loading,
    filtering,
    error,
    setError,
    search,
    setSearch,
    load,
    remove,
    removeMeditation: remove,
  };
}
