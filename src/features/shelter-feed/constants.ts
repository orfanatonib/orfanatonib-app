export const FEED_SECTIONS_ENDPOINT = '/feed-sections';
export const FEED_COMMENT_ITEMS_ENDPOINT = '/feed-section-comments';

export const FEED_COMMENT_MAX_LENGTH = 500;
export const FEED_COMMENT_PAGE_SIZE = 10;
export const FEED_MIN_TOUCH_TARGET_PX = 44;

export const SHELTER_FEED_QUERY_ROOT = 'shelter-feed' as const;

export const FEED_AUTHOR_UNKNOWN_LABEL = 'Autor não informado';

export const FEED_MESSAGES = {
  celebrateAction: 'Celebrar',
  celebratedState: 'Celebrado',
  celebrateAria: 'Celebrar esta publicação',
  uncelebrateAria: 'Remover minha celebração desta publicação',
  celebrateLoginHint: 'Entre na sua conta para celebrar.',
  celebrateError: 'Não foi possível registrar sua celebração. Tente novamente.',
  commentsToggle: 'Comentários',
  commentsTitle: 'Comentários da publicação',
  commentsEmpty: 'Ainda não há comentários. Seja o primeiro a comentar!',
  commentsLoadError: 'Não foi possível carregar os comentários.',
  commentsLoadMore: 'Ver mais comentários',
  commentsRetry: 'Tentar de novo',
  commentLabel: 'Escreva um comentário',
  commentPlaceholder: 'Compartilhe uma mensagem de carinho…',
  commentPrivacyHint:
    'Por proteção das crianças e famílias, não escreva telefone, e-mail, endereço ou links.',
  commentSubmit: 'Comentar',
  commentSubmitting: 'Enviando…',
  commentCreateError: 'Não foi possível enviar o comentário. Tente novamente.',
  commentDeleteAria: 'Remover comentário',
  commentDeleteError: 'Não foi possível remover o comentário.',
  commentErrors: {
    empty: 'Escreva um comentário antes de enviar.',
    'too-long': `O comentário pode ter no máximo ${FEED_COMMENT_MAX_LENGTH} caracteres.`,
    sensitive:
      'Por proteção das crianças e famílias, não publique telefone, e-mail, endereço ou links.',
  },
} as const;
