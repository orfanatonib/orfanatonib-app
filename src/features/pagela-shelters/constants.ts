/** Casca única da tela de Pagelas: o prefixo vale para o nível exibido (abrigos, acolhidos ou pagelas). */
export const PAGELAS_TEST_ID_PREFIX = 'pagelas';
export const PAGELAS_TITLE = '📋 Gerenciar Pagelas';

export type PagelaLevel = 'shelters' | 'sheltered' | 'pagelas';

export const PAGELA_FILTER_KEYS = {
  CITY: 'city',
  STATE: 'state',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  GENDER: 'gender',
  JOINED_FROM: 'joinedFrom',
  JOINED_TO: 'joinedTo',
  YEAR: 'year',
  PRESENT: 'present',
  REFERENCE_FROM: 'referenceFrom',
  REFERENCE_TO: 'referenceTo',
  SORT: 'sort',
} as const;

export const SHELTERS_DEFAULT_SORT = 'name:ASC';
export const SHELTERED_DEFAULT_SORT = 'name:ASC';
export const PAGELAS_DEFAULT_SORT = 'period:DESC';

export const SHELTER_SORT_OPTIONS = [
  { value: 'name:ASC', label: 'Nome: A a Z' },
  { value: 'name:DESC', label: 'Nome: Z a A' },
  { value: 'city:ASC', label: 'Cidade: A a Z' },
  { value: 'state:ASC', label: 'Estado: A a Z' },
  { value: 'createdAt:DESC', label: 'Criação: mais recentes' },
  { value: 'createdAt:ASC', label: 'Criação: mais antigos' },
] as const;

export const SHELTERED_SORT_OPTIONS = [
  { value: 'name:ASC', label: 'Nome: A a Z' },
  { value: 'name:DESC', label: 'Nome: Z a A' },
  { value: 'birthDate:ASC', label: 'Nascimento: mais velhos' },
  { value: 'birthDate:DESC', label: 'Nascimento: mais novos' },
  { value: 'joinedAt:DESC', label: 'Entrada: mais recentes' },
  { value: 'joinedAt:ASC', label: 'Entrada: mais antigas' },
] as const;

export const PAGELA_SORT_OPTIONS = [
  { value: 'period:DESC', label: 'Ano e visita: mais recentes' },
  { value: 'period:ASC', label: 'Ano e visita: mais antigas' },
  { value: 'referenceDate:DESC', label: 'Data: mais recentes' },
  { value: 'referenceDate:ASC', label: 'Data: mais antigas' },
  { value: 'member:ASC', label: 'Membro: A a Z' },
  { value: 'member:DESC', label: 'Membro: Z a A' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'F', label: 'Feminino' },
  { value: 'M', label: 'Masculino' },
] as const;

export const PRESENT_OPTIONS = [
  { value: 'true', label: 'Presente' },
  { value: 'false', label: 'Ausente' },
] as const;

export const PAGELAS_LABELS = {
  LEVEL_SHELTERS: 'Abrigos',
  LEVEL_SHELTERED: 'Acolhidos',
  LEVEL_PAGELAS: 'Pagelas',
  SEARCH_SHELTERS: 'Buscar abrigos',
  SEARCH_SHELTERED: 'Buscar acolhidos',
  SEARCH_PAGELAS: 'Buscar pagelas',
  PLACEHOLDER_SHELTERS: 'Buscar por nome, cidade, estado...',
  PLACEHOLDER_SHELTERED: 'Buscar por nome do acolhido, responsável ou telefone...',
  PLACEHOLDER_PAGELAS: 'Buscar por ano, visita, anotação ou membro...',
  EMPTY_SHELTERS: 'Não há abrigos cadastrados.',
  EMPTY_SHELTERED: 'Não há acolhidos cadastrados neste abrigo.',
  EMPTY_PAGELAS: 'Não há registros de pagelas para este acolhido.',
  LOAD_ERROR_SHELTERS: 'Erro ao carregar abrigos.',
  LOAD_ERROR_SHELTERED: 'Erro ao carregar acolhidos.',
  LOAD_ERROR_PAGELAS: 'Erro ao carregar pagelas.',
  NO_LEADER_SHELTERS: 'Nenhum abrigo encontrado',
  FILTER_CITY: 'Cidade',
  FILTER_STATE: 'Estado (UF)',
  FILTER_CREATED_FROM: 'Criado a partir de',
  FILTER_CREATED_TO: 'Criado até',
  FILTER_GENDER: 'Gênero',
  FILTER_GENDER_ALL: 'Todos',
  FILTER_JOINED_FROM: 'Entrada a partir de',
  FILTER_JOINED_TO: 'Entrada até',
  FILTER_YEAR: 'Ano',
  FILTER_PRESENT: 'Presença',
  FILTER_PRESENT_ALL: 'Presentes e ausentes',
  FILTER_REFERENCE_FROM: 'Data a partir de',
  FILTER_REFERENCE_TO: 'Data até',
  FILTER_SORT: 'Ordenar por',
  OPEN_SHELTERED: 'Ver acolhidos',
  OPEN_PAGELAS: 'Ver pagelas',
  SELECT_SHELTER: 'Selecione o Abrigo',
} as const;
