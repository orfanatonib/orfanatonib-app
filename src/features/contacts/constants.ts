export const CONTACTS_ENDPOINT = '/contact';
export const CONTACTS_TEST_ID_PREFIX = 'contacts';
export const CONTACTS_DEFAULT_SORT = 'createdAt:DESC';

export const CONTACT_FILTER_KEYS = {
  READ: 'read',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const CONTACT_SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Recebidos: mais recentes' },
  { value: 'createdAt:ASC', label: 'Recebidos: mais antigos' },
  { value: 'name:ASC', label: 'Nome: A a Z' },
  { value: 'name:DESC', label: 'Nome: Z a A' },
] as const;

export const CONTACTS_LABELS = {
  TITLE: '📞 Gerenciar Contatos',
  SEARCH: 'Buscar contatos',
  SEARCH_PLACEHOLDER: 'Buscar por nome, e-mail, telefone ou mensagem...',
  EMPTY: 'Ainda não há contatos recebidos.',
  LOAD_ERROR: 'Erro ao carregar contatos.',
  FILTER_STATUS: 'Situação',
  FILTER_STATUS_ALL: 'Todas as mensagens',
  FILTER_CREATED_FROM: 'Recebido a partir de',
  FILTER_CREATED_TO: 'Recebido até',
  FILTER_SORT: 'Ordenar por',
  READ: 'Lido',
  UNREAD: 'Não lido',
  RECEIVED_AT: 'Recebido em',
  VIEW: 'Ver detalhes',
  MARK_READ: 'Marcar como lido',
  DELETE: 'Excluir contato',
  DELETED_OK: 'Contato excluído com sucesso',
  DELETE_ERROR: 'Erro ao excluir contato',
  MARKED_OK: 'Contato marcado como lido',
  MARK_ERROR: 'Erro ao marcar como lido',
} as const;
