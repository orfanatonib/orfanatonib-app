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
/** Largura única das telas fluidas: 98% no celular, 95% no desktop. */
export const ADMIN_SHELL_FLUID_WIDTH = { xs: '98%', md: '95%' } as const;
/** Padding horizontal (px, por lado) do `<main>` do AdminLayout no desktop (`px: 4` = 32px). */
export const ADMIN_MAIN_PADDING_X_MD_PX = 32;
/**
 * Largura do frame: 98% do `admin-main` no celular (sem padding) e 95% do `admin-main` INTEIRO no
 * desktop. Como o pai tem o padding do `<main>`, a largura desktop parte de `100% + 2×padding`.
 */
export const ADMIN_SHELL_FRAME_WIDTH = {
  xs: '98%',
  md: `calc((100% + ${ADMIN_MAIN_PADDING_X_MD_PX * 2}px) * 0.95)`,
} as const;
export const ADMIN_SHELL_MAX_WIDTH_NARROW = 'lg';

/**
 * Grade padrão de cartões: quantas colunas cabem depende da largura do CONTEÚDO (que perde o menu lateral no
 * desktop), não da largura da janela. Cada cartão tem no mínimo esta largura; o que sobra é dividido.
 */
export const ADMIN_GRID_MIN_CARD_PX = 280;
export const ADMIN_GRID_SPACING = { xs: 2, md: 3 } as const;
/** Menor largura (px) de um filtro da toolbar; a linha de filtros quebra sozinha conforme o espaço. */
export const ADMIN_FILTER_MIN_PX = 190;

export const ADMIN_SHELL_TEST_ID_SUFFIX = {
  BACK: 'back',
  HEADING: 'heading',
  ACTIONS: 'actions',
  FRAME: 'frame',
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

/** Itens por página das listagens administrativas (grade de 4 colunas: múltiplo de 2, 3 e 4). */
export const ADMIN_LIST_PAGE_SIZE = 12;
export const ADMIN_SEARCH_DEBOUNCE_MS = 300;
/** Altura mínima da área de conteúdo: a tela não "pula" entre esqueleto, vazio e lista. */
export const ADMIN_CONTENT_MIN_HEIGHT = { xs: 420, md: 560 } as const;
export const ADMIN_FETCH_BAR_HEIGHT_PX = 3;

export const ADMIN_TOOLBAR_LABELS = {
  FILTERS: 'Filtros',
  CLEAR_FILTERS: 'Limpar filtros',
  DATE_FROM: 'Criado a partir de',
  DATE_TO: 'Criado até',
  PAGINATION_PREV: 'Página anterior',
  PAGINATION_NEXT: 'Próxima página',
} as const;

export const ADMIN_SORT_FILTER_KEY = 'sort';
export const ADMIN_CREATED_FROM_KEY = 'createdFrom';
export const ADMIN_CREATED_TO_KEY = 'createdTo';

export const ADMIN_DATE_DISPLAY_FORMAT = 'DD/MM/YYYY';
/** Formato que vai para a API (`createdFrom`, `createdTo`...). */
export const ADMIN_DATE_VALUE_FORMAT = 'YYYY-MM-DD';
