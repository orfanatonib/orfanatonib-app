import { useCallback } from 'react';
import { useAdminList } from '@/components/common/admin-shell/useAdminList';
import { ImagePageData } from '@/features/image-pages/types';
import { apiDeleteImagePage, fetchImagePagesPage } from './api';
import { IMAGE_PAGES_DEFAULT_SORT, IMAGE_PAGES_MESSAGES } from './constants';

const DEFAULT_FILTERS = { sort: IMAGE_PAGES_DEFAULT_SORT };

/** Listagem paginada no servidor (busca, visibilidade, datas, ordenação) + exclusão com recarga. */
export function useImagePagesList() {
  const list = useAdminList<ImagePageData>({
    fetcher: fetchImagePagesPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: IMAGE_PAGES_MESSAGES.LOAD_ERROR,
  });
  const { reload } = list;

  /** Exclui e recarrega a lista; em falha recarrega também (a página pode já ter sumido) e propaga o erro. */
  const removePage = useCallback(async (id: string) => {
    try {
      await apiDeleteImagePage(id);
    } finally {
      reload();
    }
  }, [reload]);

  return { list, removePage };
}
