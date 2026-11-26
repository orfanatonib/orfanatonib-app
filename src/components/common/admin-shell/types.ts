import type { ReactNode } from 'react';

export type AdminActionVariant = 'contained' | 'outlined';

export interface AdminPageShellProps {
  /** `data-testid` da raiz; deriva `-back`, `-heading` e `-actions`. */
  testId: string;
  title: string;
  /** Padrão: voltar uma entrada no histórico. */
  onBack?: () => void;
  /** Slot à direita da linha voltar+título. */
  actions?: ReactNode;
  /** `true` (padrão) usa a largura `xl`; `false` usa a `lg`, mais estreita. */
  fluid?: boolean;
  children: ReactNode;
}

export interface AdminListSkeletonProps {
  testId: string;
  count?: number;
  /** Mostra uma faixa de capa no esqueleto de cada cartão. */
  withCover?: boolean;
}

export interface AdminEmptyStateProps {
  testId: string;
  title?: string;
  message: string;
  icon?: ReactNode;
}

export interface AdminErrorAlertProps {
  testId: string;
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
}

export interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** `data-testid` do campo de texto. */
  testId: string;
  clearTestId?: string;
  refreshTestId?: string;
  rootTestId?: string;
  label?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** Quando informado, exibe o botão de recarregar. */
  onRefresh?: () => void;
  loading?: boolean;
}

export interface AdminCardGridProps {
  testId: string;
  children: ReactNode;
}

export interface AdminVisibilityBadge {
  label: string;
  isPublic: boolean;
  testId?: string;
}

export interface AdminCardAction {
  key: string;
  label: string;
  onClick: () => void;
  testId: string;
  ariaLabel?: string;
  icon?: ReactNode;
  variant?: AdminActionVariant;
}

export interface AdminEntityCardProps {
  testId: string;
  title: string;
  titleTestId?: string;
  subtitle?: string;
  subtitleTestId?: string;
  description?: string;
  descriptionTestId?: string;
  cover?: ReactNode;
  /** Avatar ao lado do título (cartões de pessoas). */
  avatar?: ReactNode;
  visibility?: AdminVisibilityBadge;
  meta?: ReactNode;
  onDelete?: () => void;
  deleteTestId?: string;
  deleteLabel?: string;
  actions?: AdminCardAction[];
}

/* ───────── Lista administrativa filtrada no servidor ───────── */

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminSelectFilter {
  kind: 'select';
  key: string;
  label: string;
  options: AdminFilterOption[];
  /** Texto da opção "sem filtro" (valor vazio). `null` esconde a opção (ex.: ordenação). */
  allLabel?: string | null;
}

export interface AdminDateFilter {
  kind: 'date';
  key: string;
  label: string;
}

/** Campo de texto livre (aplicado no servidor após um debounce curto). */
export interface AdminTextFilter {
  kind: 'text';
  key: string;
  label: string;
  placeholder?: string;
}

export type AdminFilterField = AdminSelectFilter | AdminDateFilter | AdminTextFilter;

/** Valores dos filtros; chave ausente ou `''` = sem filtro. */
export type AdminFilterValues = Record<string, string>;

export interface AdminListParams {
  page: number;
  limit: number;
  search: string;
  filters: AdminFilterValues;
}

export interface AdminListPage<TItem> {
  items: TItem[];
  total: number;
  totalPages: number;
}

export type AdminListFetcher<TItem> = (
  params: AdminListParams,
  signal: AbortSignal,
) => Promise<AdminListPage<TItem>>;

export interface UseAdminListOptions<TItem> {
  fetcher: AdminListFetcher<TItem>;
  pageSize?: number;
  /** Filtros iniciais (ex.: ordenação padrão). */
  defaultFilters?: AdminFilterValues;
  /** Valores de filtro que não contam como "filtro ativo" (ex.: aba de status aberta por padrão). */
  neutralFilters?: AdminFilterValues;
  errorMessage: string;
}

export interface UseAdminListResult<TItem> {
  items: TItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  search: string;
  filters: AdminFilterValues;
  /** `true` só até a primeira resposta: é quando se mostra o esqueleto. */
  initialLoading: boolean;
  /** `true` a cada nova busca; a lista anterior continua na tela. */
  fetching: boolean;
  error: string | null;
  setSearch: (value: string) => void;
  setFilter: (key: string, value: string) => void;
  setPage: (page: number) => void;
  /** Limpa busca e filtros (mantém a ordenação). */
  clearAll: () => void;
  reload: () => void;
  /** Busca ou filtro ativo (a ordenação não conta). */
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export interface AdminListToolbarProps {
  /** Prefixo dos `data-testid` (`<prefix>-toolbar`, `<prefix>-toolbar-search`, ...). */
  testIdPrefix: string;
  searchLabel: string;
  searchPlaceholder?: string;
  search: string;
  onSearchChange: (value: string) => void;
  fields: AdminFilterField[];
  filters: AdminFilterValues;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
  onRefresh: () => void;
  fetching: boolean;
  activeFilterCount: number;
  /** Ação principal à direita (ex.: botão de criar). */
  primaryAction?: ReactNode;
}

export interface AdminPaginationProps {
  testIdPrefix: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export interface AdminListContentProps {
  testIdPrefix: string;
  initialLoading: boolean;
  fetching: boolean;
  error: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  hasActiveFilters: boolean;
  emptyMessage: string;
  emptyIcon?: ReactNode;
  skeletonWithCover?: boolean;
  children: ReactNode;
}

/* ───────── Padrão 1: tabela (desktop) + cartões (mobile) ───────── */

export interface AdminTableColumn<TItem> {
  key: string;
  header: string;
  /** Chave de ordenação enviada ao servidor (`sortBy`). Sem ela a coluna não é clicável. */
  sortKey?: string;
  align?: 'left' | 'right' | 'center';
  /** Largura CSS (ex.: `120px`, `20%`). */
  width?: string;
  /** Conteúdo da célula. */
  render: (item: TItem) => ReactNode;
}

export interface AdminTableListScreenProps<TItem> {
  testIdPrefix: string;
  title: string;
  searchLabel: string;
  searchPlaceholder?: string;
  /** Filtros da toolbar. Inclua o campo `sort` (usado no mobile; no desktop a ordenação é pelo cabeçalho). */
  fields: AdminFilterField[];
  list: UseAdminListResult<TItem>;
  columns: AdminTableColumn<TItem>[];
  rowKey: (item: TItem) => string;
  /** Cartão do mobile (já com ações). */
  renderCard: (item: TItem) => ReactNode;
  emptyMessage: string;
  emptyIcon?: ReactNode;
  primaryAction?: ReactNode;
  headerActions?: ReactNode;
  overlays?: ReactNode;
  /** Abaixo deste breakpoint a tela vira cartões. Padrão `md`. */
  cardsBelow?: 'sm' | 'md' | 'lg';
}

export interface AdminDateFieldProps {
  label: string;
  /** `AAAA-MM-DD` ou `''`. */
  value: string;
  onChange: (value: string) => void;
  /** `data-testid` do `<input>`. */
  testId: string;
  /** `AAAA-MM-DD`. */
  minDate?: string;
  maxDate?: string;
}
