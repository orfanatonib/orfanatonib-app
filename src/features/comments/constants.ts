/** Prefixo dos `data-testid` da casca (`comments-manager`, `-toolbar`, `-cards`...). */
export const COMMENTS_TEST_ID_PREFIX = 'comments';

export const COMMENTS_ENDPOINT = '/comments';
export const COMMENTS_DEFAULT_SORT = 'createdAt:DESC';

export const COMMENT_FILTER_KEYS = {
  PUBLISHED: 'published',
  SHELTER: 'shelter',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const COMMENT_PUBLISHED_OPTIONS = [
  { value: 'true', label: 'Publicado' },
  { value: 'false', label: 'Não Publicado' },
] as const;

export const COMMENT_SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Envio: mais recentes' },
  { value: 'createdAt:ASC', label: 'Envio: mais antigos' },
  { value: 'name:ASC', label: 'Nome: A a Z' },
  { value: 'name:DESC', label: 'Nome: Z a A' },
  { value: 'shelter:ASC', label: 'Abrigo: A a Z' },
] as const;

export const COMMENTS_LABELS = {
  TITLE: '💬 Gerenciar Comentários',
  SEARCH: 'Buscar comentários',
  SEARCH_PLACEHOLDER: 'Buscar por nome, comentário, abrigo ou bairro...',
  FILTER_PUBLISHED: 'Status',
  FILTER_PUBLISHED_ALL: 'Todos',
  FILTER_SHELTER: 'Abrigo',
  FILTER_SHELTER_PLACEHOLDER: 'Nome do abrigo',
  FILTER_CREATED_FROM: 'Enviado a partir de',
  FILTER_CREATED_TO: 'Enviado até',
  FILTER_SORT: 'Ordenar por',
  EMPTY: 'Ainda não há comentários cadastrados.',
  LOAD_ERROR: 'Erro ao buscar comentários',
} as const;
