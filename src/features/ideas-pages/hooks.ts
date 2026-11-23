import { useCallback, useState } from 'react';
import { useAdminList } from '@/components/common/admin-shell/useAdminList';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import { apiDeleteIdeasPage, fetchIdeasPagesPage } from './api';
import { IDEAS_PAGES_DEFAULT_SORT, IDEAS_PAGES_MESSAGES } from './constants';

const DEFAULT_FILTERS = { sort: IDEAS_PAGES_DEFAULT_SORT };

/** Listagem paginada no servidor (busca, datas, ordenação) + exclusão com recarga. */
export function useIdeasPagesList() {
  const list = useAdminList<IdeasPageData>({
    fetcher: fetchIdeasPagesPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: IDEAS_PAGES_MESSAGES.LOAD_ERROR,
  });
  const { reload } = list;
  const [mutError, setMutError] = useState<string | null>(null);

  /** `true` quando a página foi excluída; em falha expõe a mensagem da API em `mutError`. A lista recarrega nos dois casos. */
  const deletePage = useCallback(async (id: string): Promise<boolean> => {
    setMutError(null);
    try {
      await apiDeleteIdeasPage(id);
    } catch (err) {
      setMutError(getApiErrorMessage(err, IDEAS_PAGES_MESSAGES.DELETE_ERROR));
      reload();
      return false;
    }
    reload();
    return true;
  }, [reload]);

  return { list, mutError, setMutError, deletePage };
}
