import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiDeleteIdeasPage, apiListIdeasPages } from './api';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';

export function useIdeasPages() {
  const [pages, setPages] = useState<IdeasPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiListIdeasPages();
      setPages(data);
    } catch (err) {
      setError(`Erro ao buscar páginas: ${getApiErrorMessage(err, 'erro desconhecido')}. Tente novamente mais tarde.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  return { pages, setPages, loading, error, setError, fetchPages };
}

export function useIdeasSearch(pages: IdeasPageData[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter(p => p.title.toLowerCase().includes(term));
  }, [pages, searchTerm]);

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  return { filtered, searchTerm, setSearchTerm, isFiltering };
}

export function useIdeasMutations(fetchPages: () => Promise<void> | void) {
  const [mutError, setMutError] = useState<string | null>(null);

  /** `true` quando a página foi excluída; em falha expõe a mensagem da API em `mutError`. */
  const deletePage = useCallback(async (id: string): Promise<boolean> => {
    setMutError(null);
    try {
      await apiDeleteIdeasPage(id);
    } catch (err) {
      setMutError(getApiErrorMessage(err, 'Erro ao excluir a página. Tente novamente.'));
      return false;
    }
    await fetchPages();
    return true;
  }, [fetchPages]);

  return { mutError, setMutError, deletePage };
}
