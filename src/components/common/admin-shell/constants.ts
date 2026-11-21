/** Alvo mínimo de toque (px) exigido para todo controle interativo. */
export const ADMIN_TOUCH_TARGET_PX = 44;

/** Quantidade padrão e limites de cartões no esqueleto de listagem. */
export const ADMIN_SKELETON_DEFAULT_COUNT = 6;
export const ADMIN_SKELETON_MIN_COUNT = 1;
export const ADMIN_SKELETON_MAX_COUNT = 12;

/** Cor dos títulos da casca, igual ao BackHeader atual. */
export const ADMIN_HEADING_COLOR = '#1a3c34';
export const ADMIN_DELETE_COLOR = '#d32f2f';

/** Largura única das telas administrativas. */
export const ADMIN_SHELL_MAX_WIDTH = 'xl';
export const ADMIN_SHELL_MAX_WIDTH_NARROW = 'lg';

/** Grade padrão de cartões (xs=1 coluna ... lg=4 colunas). */
export const ADMIN_GRID_COLUMNS = { xs: 12, sm: 6, md: 4, lg: 3 } as const;
export const ADMIN_GRID_SPACING = { xs: 2, md: 3 } as const;

export const ADMIN_SHELL_TEST_ID_SUFFIX = {
  BACK: 'back',
  HEADING: 'heading',
  ACTIONS: 'actions',
  CLEAR: 'clear',
  REFRESH: 'refresh',
  DELETE: 'delete',
  TITLE: 'title',
  VISIBILITY: 'visibility',
  COVER: 'cover',
} as const;

export const ADMIN_LABELS = {
  BACK: 'Voltar',
  BACK_ARIA: 'Voltar para a página anterior',
  CLEAR_SEARCH: 'Limpar busca',
  REFRESH: 'Recarregar',
  RETRY: 'Tentar novamente',
  LOADING: 'Carregando...',
  DELETE: 'Excluir',
  PUBLIC: 'Pública',
  PRIVATE: 'Privada',
  UNTITLED: 'Sem Título',
  SEARCH_DEFAULT_LABEL: 'Buscar',
  SEARCH_DEFAULT_PLACEHOLDER: 'Buscar por título...',
  EMPTY_TITLE: '📭 Nenhum item encontrado',
  EMPTY_FILTERED: 'Tente ajustar sua busca ou limpar os filtros.',
} as const;
