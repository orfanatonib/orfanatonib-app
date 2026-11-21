import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { getImageSectionsPendingCount, listImageSections, listMyImageSections } from './api';
import {
  IMAGE_SECTIONS_MESSAGES,
  IMAGE_SECTIONS_PENDING_POLL_MS,
  IMAGE_SECTIONS_STALE_TIME_MS,
  imageSectionKeys,
} from './constants';
import type { MyImageSection } from './types';

export function useImageSections() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listImageSections();
      setSections(data);
      setFilteredSections(data);
    } catch (error: unknown) {
      console.error('Falha ao listar as seções de imagens', error);
      setError(IMAGE_SECTIONS_MESSAGES.LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) {
        setFilteredSections(sections);
      } else {
        setFilteredSections(
          sections.filter((s) =>
            (s.caption ?? '').toLowerCase().includes(term) ||
            (s.description ?? '').toLowerCase().includes(term)
          )
        );
      }
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, sections]);

  return {
    sections,
    filteredSections,
    searchTerm,
    setSearchTerm,
    loading,
    isFiltering,
    error,
    setError,
    fetchSections,
  };
}

/** "Minhas publicações" do autor logado; `reload` recarrega depois de um envio. */
export function useMyImageSections() {
  const [items, setItems] = useState<MyImageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setItems(await listMyImageSections());
    } catch (error: unknown) {
      console.error('Falha ao listar as próprias publicações', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, failed, reload };
}

/** Pendentes para o selo do painel. Só liga quando `enabled` (admin logado). */
export function usePendingImageSectionsCount(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: imageSectionKeys.pendingCount(userId),
    queryFn: ({ signal }) => getImageSectionsPendingCount(signal),
    enabled,
    refetchInterval: IMAGE_SECTIONS_PENDING_POLL_MS,
    staleTime: IMAGE_SECTIONS_STALE_TIME_MS,
    retry: false,
  });
}

/** Refaz o selo depois de aprovar, reprovar ou apagar uma publicação. */
export function useRefreshImageSectionsPending(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: imageSectionKeys.root }),
    [queryClient],
  );
}
