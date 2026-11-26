export const INFORMATIVES_ENDPOINT = '/informatives';
export const INFORMATIVES_TEST_ID_PREFIX = 'informatives';
export const INFORMATIVES_DEFAULT_SORT = 'createdAt:DESC';

export const INFORMATIVE_FILTER_KEYS = {
  PUBLIC: 'public',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const INFORMATIVE_VISIBILITY_OPTIONS = [
  { value: 'true', label: 'Públicos' },
  { value: 'false', label: 'Privados' },
] as const;

export const INFORMATIVE_SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Criação: mais recentes' },
  { value: 'createdAt:ASC', label: 'Criação: mais antigos' },
  { value: 'title:ASC', label: 'Título: A a Z' },
  { value: 'title:DESC', label: 'Título: Z a A' },
] as const;

export const INFORMATIVES_LABELS = {
  TITLE: '📢 Banners Informativos',
  SEARCH: 'Buscar informativos',
  SEARCH_PLACEHOLDER: 'Buscar por título ou descrição...',
  EMPTY: 'Ainda não há banners informativos cadastrados.',
  LOAD_ERROR: 'Erro ao buscar banners informativos.',
  DELETE_ERROR: 'Erro ao excluir o banner. Tente novamente.',
  CREATE: 'Novo banner',
  FILTER_VISIBILITY: 'Visibilidade',
  FILTER_VISIBILITY_ALL: 'Todos',
  FILTER_CREATED_FROM: 'Criado a partir de',
  FILTER_CREATED_TO: 'Criado até',
  FILTER_SORT: 'Ordenar por',
  EDIT: 'Editar',
  DELETE: 'Excluir banner',
  PUBLIC: 'Público',
  PRIVATE: 'Privado',
  CREATED_AT: 'Criado em',
} as const;
