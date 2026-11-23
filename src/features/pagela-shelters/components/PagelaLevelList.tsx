import { Fragment } from 'react';
import type { ReactNode } from 'react';
import {
  AdminCardGrid,
  AdminListContent,
  AdminListToolbar,
  AdminPagination,
  useAdminList,
} from '@/components/common/admin-shell';
import type { AdminFilterField, AdminListFetcher } from '@/components/common/admin-shell';
import { ADMIN_SORT_FILTER_KEY } from '@/components/common/admin-shell/constants';
import { PAGELAS_TEST_ID_PREFIX } from '../constants';

interface Props<TItem> {
  fetcher: AdminListFetcher<TItem>;
  defaultSort: string;
  fields: AdminFilterField[];
  searchLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
  errorMessage: string;
  emptyIcon: ReactNode;
  rowKey: (item: TItem) => string;
  renderItem: (item: TItem) => ReactNode;
  /** Nível exibido (`shelters`, `sheltered` ou `pagelas`): vai no `data-level` do conteúdo para os testes. */
  level: string;
}

/**
 * Miolo de um nível do fluxo de pagelas: a MESMA toolbar, área de conteúdo estável e paginação da casca
 * `AdminListScreen`, com busca, filtros, ordenação e página no servidor. Cada nível troca só o fetcher e os campos.
 */
export default function PagelaLevelList<TItem>({
  fetcher,
  defaultSort,
  fields,
  searchLabel,
  searchPlaceholder,
  emptyMessage,
  errorMessage,
  emptyIcon,
  rowKey,
  renderItem,
  level,
}: Props<TItem>) {
  const list = useAdminList<TItem>({
    fetcher,
    defaultFilters: { [ADMIN_SORT_FILTER_KEY]: defaultSort },
    errorMessage,
  });
  const P = PAGELAS_TEST_ID_PREFIX;

  return (
    <div data-testid={`${P}-level`} data-level={level}>
      <AdminListToolbar
        testIdPrefix={P}
        searchLabel={searchLabel}
        searchPlaceholder={searchPlaceholder}
        search={list.search}
        onSearchChange={list.setSearch}
        fields={fields}
        filters={list.filters}
        onFilterChange={list.setFilter}
        onClearAll={list.clearAll}
        onRefresh={list.reload}
        fetching={list.fetching}
        activeFilterCount={list.activeFilterCount}
      />

      <AdminListContent
        testIdPrefix={P}
        initialLoading={list.initialLoading}
        fetching={list.fetching}
        error={list.error}
        onRetry={list.reload}
        isEmpty={list.items.length === 0}
        hasActiveFilters={list.hasActiveFilters}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
        skeletonWithCover={false}
      >
        <AdminCardGrid testId={`${P}-cards`}>
          {list.items.map((item) => (
            <Fragment key={rowKey(item)}>{renderItem(item)}</Fragment>
          ))}
        </AdminCardGrid>
      </AdminListContent>

      <AdminPagination
        testIdPrefix={P}
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        onChange={list.setPage}
      />
    </div>
  );
}
