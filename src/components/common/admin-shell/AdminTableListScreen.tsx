import { useMediaQuery, useTheme } from '@mui/material';
import AdminPageShell from './AdminPageShell';
import AdminListToolbar from './AdminListToolbar';
import AdminListContent from './AdminListContent';
import AdminPagination from './AdminPagination';
import AdminCardGrid from './AdminCardGrid';
import AdminDataTable from './AdminDataTable';
import { ADMIN_SORT_FILTER_KEY } from './constants';
import type { AdminTableListScreenProps } from './types';

/**
 * Padrão 1 das telas administrativas: toolbar + TABELA com ordenação no cabeçalho no desktop;
 * toolbar + CARTÕES com seletor de ordenação no mobile. Busca, filtros, ordenação e página
 * são sempre do servidor (`useAdminList`). A casca (título, toolbar, conteúdo estável,
 * paginação, largura 95%/98%) é a mesma do padrão 2 (`AdminListScreen`).
 */
export default function AdminTableListScreen<TItem>({
  testIdPrefix,
  title,
  searchLabel,
  searchPlaceholder,
  fields,
  list,
  columns,
  rowKey,
  renderCard,
  emptyMessage,
  emptyIcon,
  primaryAction,
  headerActions,
  overlays,
  cardsBelow = 'md',
}: AdminTableListScreenProps<TItem>) {
  const theme = useTheme();
  const asCards = useMediaQuery(theme.breakpoints.down(cardsBelow), { noSsr: true });
  // No desktop a ordenação é pelo cabeçalho da tabela; o seletor só existe no mobile.
  const toolbarFields = asCards ? fields : fields.filter((field) => field.key !== ADMIN_SORT_FILTER_KEY);

  return (
    <AdminPageShell testId={`${testIdPrefix}-manager`} title={title} actions={headerActions}>
      <AdminListToolbar
        testIdPrefix={testIdPrefix}
        searchLabel={searchLabel}
        searchPlaceholder={searchPlaceholder}
        search={list.search}
        onSearchChange={list.setSearch}
        fields={toolbarFields}
        filters={list.filters}
        onFilterChange={list.setFilter}
        onClearAll={list.clearAll}
        onRefresh={list.reload}
        fetching={list.fetching}
        activeFilterCount={list.activeFilterCount}
        primaryAction={primaryAction}
      />

      <AdminListContent
        testIdPrefix={testIdPrefix}
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
        {asCards ? (
          <AdminCardGrid testId={`${testIdPrefix}-cards`}>
            {list.items.map((item) => (
              <div key={rowKey(item)} style={{ width: '100%' }}>
                {renderCard(item)}
              </div>
            ))}
          </AdminCardGrid>
        ) : (
          <AdminDataTable
            testIdPrefix={testIdPrefix}
            columns={columns}
            items={list.items}
            rowKey={rowKey}
            list={list}
          />
        )}
      </AdminListContent>

      <AdminPagination
        testIdPrefix={testIdPrefix}
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        onChange={list.setPage}
      />

      {overlays}
    </AdminPageShell>
  );
}
