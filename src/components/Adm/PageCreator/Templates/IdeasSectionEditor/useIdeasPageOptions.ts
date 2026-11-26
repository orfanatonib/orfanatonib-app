import { useEffect, useRef, useState } from 'react';
import { ideasSectionErrorMessage, listIdeasPages } from '@/features/ideas-sections';
import { IDEAS_SECTION_ADMIN_COPY } from './constants';
import type { IdeasPageOption } from './types';

/** Páginas de ideias que podem receber a seção; entrega o erro pronto para exibir. */
export function useIdeasPageOptions(onError: (message: string) => void) {
  const [pages, setPages] = useState<IdeasPageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await listIdeasPages();
        if (active) setPages(result);
      } catch (error: unknown) {
        if (active) onErrorRef.current(ideasSectionErrorMessage(error, IDEAS_SECTION_ADMIN_COPY.LOAD_PAGES_FAILED));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return { pages, loading };
}
