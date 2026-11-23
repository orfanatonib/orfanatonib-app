export const DOCUMENTS_ENDPOINT = '/documents';
export const DOCUMENTS_TEST_ID_PREFIX = 'documents';
export const DOCUMENTS_DEFAULT_SORT = 'createdAt:DESC';

export const DOCUMENT_FILTER_KEYS = {
  UPLOAD_TYPE: 'uploadType',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const DOCUMENT_UPLOAD_TYPE_OPTIONS = [
  { value: 'upload', label: 'Arquivo enviado' },
  { value: 'link', label: 'Link externo' },
] as const;

export const DOCUMENT_SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Criação: mais recentes' },
  { value: 'createdAt:ASC', label: 'Criação: mais antigas' },
  { value: 'name:ASC', label: 'Nome: A a Z' },
  { value: 'name:DESC', label: 'Nome: Z a A' },
] as const;

export const DOCUMENTS_LABELS = {
  TITLE: '📄 Gerenciar Documentos',
  SEARCH: 'Buscar documentos',
  SEARCH_PLACEHOLDER: 'Buscar por nome ou descrição...',
  EMPTY: 'Ainda não há documentos cadastrados.',
  LOAD_ERROR: 'Erro ao carregar documentos.',
  CREATE: 'Novo documento',
  FILTER_TYPE: 'Tipo',
  FILTER_TYPE_ALL: 'Todos os tipos',
  FILTER_CREATED_FROM: 'Criado a partir de',
  FILTER_CREATED_TO: 'Criado até',
  FILTER_SORT: 'Ordenar por',
  VIEW: 'Ver',
  DETAILS: 'Dados',
  EDIT: 'Editar',
  DELETE: 'Excluir documento',
  NO_DESCRIPTION: 'Sem descrição',
  CREATED_AT: 'Criado em',
  UPLOAD_CHIP: 'Upload',
  LINK_CHIP: 'Link',
  CREATED_OK: 'Documento criado com sucesso!',
  UPDATED_OK: 'Documento atualizado com sucesso!',
  DELETED_OK: 'Documento excluído com sucesso!',
  DELETE_ERROR: 'Erro ao excluir documento.',
  FORM_EDIT_TITLE: 'Editar Documento',
  FORM_NEW_TITLE: 'Novo Documento',
  FORM_EDIT_SUBTITLE: 'Atualize as informações do documento selecionado',
  FORM_NEW_SUBTITLE: 'Preencha os campos para cadastrar um novo documento',
} as const;
