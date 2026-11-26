import type { ReactNode } from 'react';
import AdminPageShell from './AdminPageShell';
import AdminListToolbar from './AdminListToolbar';
import AdminListContent from './AdminListContent';
import AdminPagination from './AdminPagination';
import type { AdminFilterField, UseAdminListResult } from './types';

interface Props<TItem> {
  /** Prefixo único da tela (`documents`, `image-pages`...): deriva todos os `data-testid`. */
  testIdPrefix: string;
  title: string;
  searchLabel: string;
  searchPlaceholder?: string;
  fields: AdminFilterField[];
  list: UseAdminListResult<TItem>;
  emptyMessage: string;
  emptyIcon?: ReactNode;
  skeletonWithCover?: boolean;
  /** Botão principal da toolbar (criar). */
  primaryAction?: ReactNode;
  /** Ações à direita do título. */
  headerActions?: ReactNode;
  /** Faixa opcional entre a toolbar e o conteúdo (ex.: painel de aniversariantes). Nunca empurra a toolbar. */
  belowToolbar?: ReactNode;
  /** Faixa opcional entre o título e a toolbar (avisos, alertas de ação). */
  beforeToolbar?: ReactNode;
  /** Cartões da página atual (já dentro de `AdminCardGrid`). */
  children: ReactNode;
  /** Diálogos, modais e snackbars da tela. */
  overlays?: ReactNode;
}

/**
 * Casca única das seis telas de gestão de conteúdo: título, toolbar, conteúdo estável e paginação.
 * A tela só decide o que é específico dela (filtros, cartão, diálogos).
 */
export default function AdminListScreen<TItem>({
  testIdPrefix,
  title,
  searchLabel,
  searchPlaceholder,
  fields,
  list,
  emptyMessage,
  emptyIcon,
  skeletonWithCover,
  primaryAction,
  headerActions,
  beforeToolbar,
  belowToolbar,
  children,
  overlays,
}: Props<TItem>) {
  return (
    <AdminPageShell testId={`${testIdPrefix}-manager`} title={title} actions={headerActions}>
      {beforeToolbar}

      <AdminListToolbar
        testIdPrefix={testIdPrefix}
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
        primaryAction={primaryAction}
      />

      {belowToolbar}

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
        skeletonWithCover={skeletonWithCover}
      >
        {children}
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
