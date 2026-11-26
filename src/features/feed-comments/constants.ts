import { FeedCommentStatus } from './types';
import type { ModerationFeedCommentsQuery } from './types';

export const FEED_COMMENTS_ADMIN_ROUTE = '/adm/comentarios-feed';
export const FEED_COMMENTS_ADMIN_PATH = 'comentarios-feed';

export const FEED_SECTIONS_ENDPOINT = '/feed-sections';
export const FEED_COMMENT_ITEMS_ENDPOINT = '/feed-section-comments';

export const FEED_COMMENTS_MAX_LENGTH = 500;
export const FEED_COMMENTS_REASON_MAX_LENGTH = 500;
export const FEED_COMMENTS_INITIAL_PAGE = 1;
export const FEED_COMMENTS_PAGE_SIZE = 10;
export const FEED_COMMENTS_PAGE_SIZES = [10, 20, 50];
export const FEED_COMMENTS_MINE_PAGE_SIZE = 20;
export const FEED_COMMENTS_STALE_TIME_MS = 15_000;
export const FEED_COMMENTS_PENDING_POLL_MS = 60_000;
export const FEED_COMMENTS_TOUCH_TARGET_PX = 44;
export const FEED_COMMENTS_ALL_STATUSES = '' as const;
export const FEED_COMMENTS_PENDING_BADGE_MAX = 99;

/** Aba aberta ao entrar no painel: o que precisa de decisão. */
export const FEED_COMMENTS_DEFAULT_STATUS = FeedCommentStatus.PENDING;

/** Prefixo dos `data-testid` da casca (`feed-comments-manager`, `-toolbar`, `-cards`...). */
export const FEED_COMMENTS_TEST_ID_PREFIX = 'feed-comments';
export const FEED_COMMENTS_DEFAULT_SORT = 'createdAt:DESC';

export const FEED_COMMENT_FILTER_KEYS = {
  STATUS: 'status',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const FEED_COMMENT_SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Envio: mais recentes' },
  { value: 'createdAt:ASC', label: 'Envio: mais antigos' },
  { value: 'reviewedAt:DESC', label: 'Revisão: mais recentes' },
  { value: 'reviewedAt:ASC', label: 'Revisão: mais antigas' },
] as const;

export const FEED_COMMENT_STATUS_LABELS: Record<FeedCommentStatus, string> = {
  [FeedCommentStatus.PENDING]: 'Aguardando aprovação',
  [FeedCommentStatus.APPROVED]: 'Publicado',
  [FeedCommentStatus.REJECTED]: 'Não aprovado',
};

export const FEED_COMMENT_STATUS_TAB_LABELS: Record<FeedCommentStatus, string> = {
  [FeedCommentStatus.PENDING]: 'Pendentes',
  [FeedCommentStatus.APPROVED]: 'Aprovados',
  [FeedCommentStatus.REJECTED]: 'Reprovados',
};

export const FEED_COMMENT_STATUS_COLORS = {
  [FeedCommentStatus.PENDING]: 'warning',
  [FeedCommentStatus.APPROVED]: 'success',
  [FeedCommentStatus.REJECTED]: 'error',
} as const;

/** Ordem das abas do painel. */
export const FEED_COMMENT_TAB_ORDER: readonly FeedCommentStatus[] = [
  FeedCommentStatus.PENDING,
  FeedCommentStatus.APPROVED,
  FeedCommentStatus.REJECTED,
];

export const feedCommentKeys = {
  all: ['feed-comments'] as const,
  moderation: (userId: string | null, query: ModerationFeedCommentsQuery) =>
    ['feed-comments', 'moderation', userId, query] as const,
  pendingCount: (userId: string | null) => ['feed-comments', 'pending-count', userId] as const,
};

export const FEED_COMMENTS_MESSAGES = {
  pendingNotice: 'Seu comentário foi enviado e aguarda aprovação.',
  pendingNoticeDetail: 'Ele só aparece para todos depois que a equipe aprovar.',
  mineTitle: 'Seus comentários',
  rejectedTitle: 'Comentário não aprovado',
  rejectedReasonLabel: 'Motivo',
  deleteMineAria: 'Excluir meu comentário',
  deleteMine: 'Excluir',
  mineDeleteError: 'Não foi possível excluir o comentário.',
  createError: 'Não foi possível enviar o comentário. Tente novamente.',
  mineLoadError: 'Não foi possível carregar os seus comentários.',
  managerTitle: 'Comentários do feed',
  managerSummary: 'Revise cada comentário antes de ele aparecer para todos no feed dos abrigos.',
  searchPlaceholder: 'Buscar por autor, comentário ou publicação...',
  statusFilterLabel: 'Status',
  searchLabel: 'Buscar comentários',
  filterCreatedFrom: 'Enviado a partir de',
  filterCreatedTo: 'Enviado até',
  filterSort: 'Ordenar por',
  allStatuses: 'Todos',
  emptyTitle: 'Nenhum comentário encontrado',
  emptyPending: 'Não há comentários aguardando aprovação.',
  emptyOther: 'Ajuste a busca ou o status para ver outros comentários.',
  loadError: 'Não foi possível carregar os comentários.',
  review: 'Revisar comentário',
  reviewTitle: 'Revisar comentário',
  approve: 'Aprovar e publicar',
  reject: 'Reprovar',
  rejectReasonLabel: 'Motivo da reprovação',
  rejectReasonHelp: 'Obrigatório para reprovar. O autor recebe este motivo no feed e por e-mail.',
  rejectReasonRequired: 'Informe o motivo antes de reprovar.',
  close: 'Fechar',
  saving: 'Salvando...',
  delete: 'Excluir comentário',
  deleteConfirmTitle: 'Excluir comentário?',
  deleteConfirmBody: 'O comentário será removido de vez. Esta ação não pode ser desfeita.',
  deleteConfirm: 'Excluir',
  deleteCancel: 'Cancelar',
  decideError: 'Não foi possível salvar a decisão.',
  deleteError: 'Não foi possível excluir o comentário.',
  previousReason: 'Motivo anterior',
  lastReview: 'Última revisão',
  administrator: 'Administrador',
  postLabel: 'Publicação',
  noPost: 'Publicação indisponível',
  noPhoto: 'Sem foto ou vídeo',
  videoPost: 'Vídeo da publicação',
  unknownAuthor: 'Participante',
  pendingBadgeAria: 'comentários aguardando aprovação',
} as const;

/** `data-testid` estáveis (kebab-case, prefixo `feed-comments-`). */
export const FEED_COMMENTS_TEST_IDS = {
  MANAGER: 'feed-comments-manager',
  TAB_PREFIX: 'feed-comments-tab',
  TAB_COUNT_PREFIX: 'feed-comments-tab-count',
  CARD_PREFIX: 'feed-comments-card',
  CARD_STATUS_PREFIX: 'feed-comments-card-status',
  REVIEW_PREFIX: 'feed-comments-review',
  REVIEW_DIALOG: 'feed-comments-review-dialog',
  REVIEW_TEXT: 'feed-comments-review-text',
  REVIEW_POST: 'feed-comments-review-post',
  REVIEW_PHOTO: 'feed-comments-review-photo',
  REVIEW_REASON: 'feed-comments-review-reason',
  REVIEW_ERROR: 'feed-comments-review-error',
  APPROVE: 'feed-comments-approve',
  REJECT: 'feed-comments-reject',
  DELETE: 'feed-comments-delete',
  DELETE_CONFIRM: 'feed-comments-delete-confirm',
  DELETE_CANCEL: 'feed-comments-delete-cancel',
  CLOSE: 'feed-comments-review-close',
  PENDING_BADGE: 'feed-comments-pending-badge',
  PENDING_NOTICE: 'feed-comments-pending-notice',
  MINE_LIST: 'feed-comments-mine-list',
  MINE_ITEM: 'feed-comments-mine-item',
  MINE_STATUS: 'feed-comments-mine-status',
  MINE_REASON: 'feed-comments-mine-reason',
  MINE_DELETE: 'feed-comments-mine-delete',
} as const;
