import { FeedbackCategory, FeedbackCategoryLabels } from '@/store/slices/types';

export const FEEDBACKS_ENDPOINT = '/site-feedbacks';
export const FEEDBACKS_TEST_ID_PREFIX = 'feedbacks';
export const FEEDBACKS_DEFAULT_SORT = 'createdAt:DESC';
export const FEEDBACK_MAX_RATING = 5;

export const FEEDBACK_FILTER_KEYS = {
  READ: 'read',
  CATEGORY: 'category',
  RATING: 'rating',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const FEEDBACK_CATEGORY_OPTIONS = Object.values(FeedbackCategory).map((category) => ({
  value: category,
  label: FeedbackCategoryLabels[category],
}));

export const FEEDBACK_RATING_OPTIONS = Array.from({ length: FEEDBACK_MAX_RATING }, (_, index) => {
  const rating = FEEDBACK_MAX_RATING - index;
  return { value: String(rating), label: `${rating} ${rating === 1 ? 'estrela' : 'estrelas'}` };
});

export const FEEDBACK_SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Recebidos: mais recentes' },
  { value: 'createdAt:ASC', label: 'Recebidos: mais antigos' },
  { value: 'rating:DESC', label: 'Nota: maior primeiro' },
  { value: 'rating:ASC', label: 'Nota: menor primeiro' },
  { value: 'name:ASC', label: 'Nome: A a Z' },
  { value: 'name:DESC', label: 'Nome: Z a A' },
] as const;

export const FEEDBACKS_LABELS = {
  TITLE: '💬 Feedbacks Recebidos',
  SEARCH: 'Buscar feedbacks',
  SEARCH_PLACEHOLDER: 'Buscar por nome, e-mail ou comentário...',
  EMPTY: 'Ainda não há feedbacks recebidos.',
  LOAD_ERROR: 'Erro ao carregar feedbacks.',
  FILTER_STATUS: 'Situação',
  FILTER_STATUS_ALL: 'Todos os feedbacks',
  FILTER_CATEGORY: 'Tipo',
  FILTER_CATEGORY_ALL: 'Todos os tipos',
  FILTER_RATING: 'Nota',
  FILTER_RATING_ALL: 'Todas as notas',
  FILTER_CREATED_FROM: 'Recebido a partir de',
  FILTER_CREATED_TO: 'Recebido até',
  FILTER_SORT: 'Ordenar por',
  READ: 'Lido',
  UNREAD: 'Não lido',
  RECEIVED_AT: 'Recebido em',
  NO_EMAIL: 'Sem e-mail',
  VIEW: 'Ver detalhes',
  MARK_READ: 'Marcar como lido',
  DELETE: 'Excluir feedback',
  DELETED_OK: 'Feedback excluído com sucesso',
  DELETE_ERROR: 'Erro ao excluir feedback',
  MARKED_OK: 'Feedback marcado como lido',
  MARK_ERROR: 'Erro ao marcar como lido',
} as const;
