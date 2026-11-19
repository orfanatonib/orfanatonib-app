import { FeedViewMode } from './types';

export const FEED_SECTIONS_ENDPOINT = '/feed-sections';
export const FEED_IMAGE_PAGES_ENDPOINT = '/image-pages';
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

/** Lote por requisição (a API aceita até 50) e frescor do cache do feed. */
export const FEED_INITIAL_PAGE = 1;
export const FEED_SECTIONS_PAGE_SIZE = 6;
export const FEED_MAX_PAGE_SIZE = 50;
export const FEED_STALE_TIME_MS = 2 * 60 * 1000;

export const FEED_MAX_STORY_HIGHLIGHTS = 12;
/** Destaques: avanço automático a cada 5 s, em loop; com poucos itens eles se repetem até este mínimo. */
export const FEED_HIGHLIGHTS_INTERVAL_MS = 5000;
export const FEED_HIGHLIGHTS_MIN_LOOP_ITEMS = 6;
export const FEED_HIGHLIGHTS_SLOT_PX = 96;
export const FEED_HIGHLIGHTS_TOUCH_RESUME_MS = 4000;
export const FEED_COLLAGE_PREVIEW_LIMIT = 5;
export const FEED_SKELETON_CARD_COUNT = 2;
export const FEED_LIGHTBOX_SWIPE_THRESHOLD_PX = 48;
export const FEED_COPY_FEEDBACK_DURATION_MS = 2400;
export const FEED_SENTINEL_MARGIN = '280px 0px';
/** Quantas páginas extras o deep link pode buscar até achar a publicação. */
export const FEED_DEEP_LINK_MAX_EXTRA_PAGES = 10;

/** Largura mobile-first compartilhada por cabeçalho, conteúdo e esqueleto. */
export const FEED_CONTAINER_WIDTH = { xs: '98%', md: '95%' } as const;
export const FEED_CONTENT_MAX_WIDTH = 'none';

/** Prefixo do id HTML usado como âncora de uma publicação (deep link `#publicacao-feed-<id>`). */
/** Parâmetro do link compartilhado com o índice da foto/vídeo a abrir no lightbox. */
export const FEED_MEDIA_QUERY_PARAM = 'midia';
export const FEED_SECTION_ANCHOR_PREFIX = 'publicacao-feed-';

export const FEED_ROUTES = {
  HOME: '/',
  UPLOAD_PHOTOS: '/area-do-membro/imagens-abrigo',
  ADMIN_MEDIA: '/adm/fotos-abrigos',
} as const;

/** Chaves de cache da lista: incluem a galeria, o lote e o usuário (autoria/"celebrado" são por pessoa). */
export const shelterFeedListKeys = {
  all: [SHELTER_FEED_QUERY_ROOT, 'sections'] as const,
  sections: (pageId: string, limit: number, viewerId: string) =>
    [SHELTER_FEED_QUERY_ROOT, 'sections', { pageId, limit, viewerId }] as const,
};

export const PT_BR_MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const;

export const PT_BR_SHORT_MONTH_NAMES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
] as const;

export const FEED_VIEW_MODE_OPTIONS: ReadonlyArray<{
  mode: FeedViewMode;
  label: string;
  shortLabel: string;
}> = [
  { mode: FeedViewMode.TIMELINE, label: 'Publicações', shortLabel: 'Feed' },
  { mode: FeedViewMode.BENTO, label: 'Momentos', shortLabel: 'Momentos' },
  { mode: FeedViewMode.GALLERY, label: 'Fotos e vídeos', shortLabel: 'Fotos' },
];

/** Cores da superfície do feed (a marca verde segue a barra de navegação pública). */
export const FEED_PALETTE = {
  canvas: '#f4f6f8',
  canvasElevated: '#ffffff',
  canvasSubtle: '#eef1f4',
  brandLeaf: '#81d742',
  brandLeafDark: '#2e7d32',
  brandForest: '#2e7d32',
  brandForestDeep: '#256529',
  brandSoft: '#f0f8e9',
  link: '#0073e6',
  coralHeart: '#c62846',
  coralHeartSoft: '#fff0f3',
  mediaFallbackGradient: 'linear-gradient(135deg, #52606d 0%, #263238 100%)',
  inkPrimary: '#263238',
  inkSecondary: '#52606d',
  inkMuted: '#626e79',
  borderSubtle: '#e2e7eb',
  borderStrong: '#c9d3dc',
  storyRingActive: 'linear-gradient(135deg, #81d742 0%, #2e7d32 100%)',
  storyRingViewed: 'linear-gradient(135deg, #dce1e6 0%, #aab4be 100%)',
  cardShadow: '0 2px 8px rgba(38, 50, 56, 0.03)',
  cardShadowHover: '0 4px 16px rgba(38, 50, 56, 0.07)',
  lightboxBackdrop: '#111820',
} as const;

export const FEED_PAGE_MESSAGES = {
  HERO_EYEBROW: 'NOTÍCIAS DOS NOSSOS ABRIGOS',
  DEFAULT_TITLE: 'Feed do Ministério de Orfanatos NIB',
  DEFAULT_SUBTITLE: 'Acompanhe as visitas, os encontros e os momentos especiais nos abrigos assistidos pelo ministério.',
  PUBLISHER: 'Ministério de Orfanatos NIB',
  MISSING_CONFIG: 'O identificador da galeria do feed não está configurado neste ambiente.',
  LOAD_ERROR: 'Não foi possível carregar as publicações do feed agora. Verifique sua conexão e tente novamente.',
  NEXT_PAGE_ERROR: 'Não foi possível carregar mais publicações. Tente novamente.',
  EMPTY_TITLE: 'As novidades dos abrigos chegam por aqui',
  EMPTY_DESCRIPTION:
    'Assim que novas fotos, vídeos e histórias das visitas aos abrigos forem publicadas, elas aparecerão aqui.',
  FILTER_EMPTY_TITLE: 'Nenhuma publicação encontrada',
  FILTER_EMPTY_DESCRIPTION: 'Tente buscar por outro termo ou limpe o filtro para ver todas as publicações carregadas.',
  END_OF_FEED: 'Você viu todas as publicações',
  UNTITLED_SECTION: 'Momento no abrigo',
  UPLOAD_CTA: 'Enviar fotos ou vídeo do abrigo',
  RAIL_FOOTER: 'Cada visita, uma nova história. Acompanhe o que acontece nos abrigos assistidos.',
  SHARE_COPIED: 'Link copiado!',
  SHARE: 'Compartilhar',
} as const;

/** Seletores estáveis (`data-testid`) para os E2E; prefixos recebem `-<id>` da publicação. */
export const FEED_TEST_IDS = {
  PAGE_ROOT: 'shelter-feed-page',
  CONTENT: 'shelter-feed-content',
  HERO_BANNER: 'shelter-feed-hero-banner',
  HERO_HOME_BUTTON: 'shelter-feed-hero-home-button',
  HERO_REFRESH_BUTTON: 'shelter-feed-hero-refresh-button',
  HERO_UPLOAD_BUTTON: 'shelter-feed-hero-upload-button',
  HERO_MANAGE_BUTTON: 'shelter-feed-hero-manage-button',
  HERO_COUNT: 'shelter-feed-hero-count',
  HIGHLIGHTS: 'shelter-feed-highlights',
  HIGHLIGHTS_EMPTY: 'shelter-feed-highlights-empty',
  HIGHLIGHTS_TITLE: 'shelter-feed-highlights-title',
  HIGHLIGHTS_TRACK: 'shelter-feed-highlights-track',
  HIGHLIGHTS_ITEM_PREFIX: 'shelter-feed-highlights-item',
  HIGHLIGHTS_PREV: 'shelter-feed-highlights-prev',
  HIGHLIGHTS_NEXT: 'shelter-feed-highlights-next',
  HIGHLIGHTS_DOTS: 'shelter-feed-highlights-dots',
  HIGHLIGHTS_DOT_PREFIX: 'shelter-feed-highlights-dot',
  HIGHLIGHTS_LIVE: 'shelter-feed-highlights-live',
  HIGHLIGHTS_STATE: 'shelter-feed-highlights-state',
  CONTROL_BAR: 'shelter-feed-control-bar',
  VIEW_MODE_PREFIX: 'shelter-feed-view-mode',
  SEARCH_INPUT: 'shelter-feed-search-input',
  SEARCH_CLEAR: 'shelter-feed-search-clear',
  SEARCH_STATUS: 'shelter-feed-search-status',
  TIMELINE_RAIL: 'shelter-feed-timeline-rail',
  TIMELINE_STREAM: 'shelter-feed-timeline-stream',
  RECENT_POST_PREFIX: 'shelter-feed-recent-post',
  RAIL_MONTH_PREFIX: 'shelter-feed-rail-month',
  RAIL_UPLOAD: 'shelter-feed-sidebar-upload',
  BACK_TO_TOP: 'shelter-feed-back-to-top',
  POST_CARD: 'shelter-feed-section',
  POST_PHOTOS_PREFIX: 'shelter-feed-post-photos',
  POST_SHARE_PREFIX: 'shelter-feed-post-share',
  COLLAGE_PREFIX: 'shelter-feed-collage',
  COLLAGE_EXPAND_PREFIX: 'shelter-feed-collage-expand',
  MEDIA_FRAME_PREFIX: 'shelter-feed-media-frame',
  VIDEO_PLAYER: 'shelter-feed-video-player',
  VIDEO_ERROR: 'shelter-feed-video-error',
  BENTO_MURAL: 'shelter-feed-bento-mural',
  BENTO_TILE_PREFIX: 'shelter-feed-bento-tile',
  PHOTO_WALL: 'shelter-feed-photo-wall',
  PHOTO_WALL_EMPTY: 'shelter-feed-photo-wall-empty',
  PHOTO_WALL_ITEM_PREFIX: 'shelter-feed-photo-wall-item',
  LIGHTBOX_DIALOG: 'shelter-feed-lightbox-dialog',
  LIGHTBOX_IMAGE: 'shelter-feed-lightbox-image',
  LIGHTBOX_COUNTER: 'shelter-feed-lightbox-counter',
  LIGHTBOX_PREV: 'shelter-feed-lightbox-prev',
  LIGHTBOX_NEXT: 'shelter-feed-lightbox-next',
  LIGHTBOX_CLOSE: 'shelter-feed-lightbox-close',
  LIGHTBOX_SHARE: 'shelter-feed-lightbox-share',
  LIGHTBOX_THUMB_PREFIX: 'shelter-feed-lightbox-thumb',
  LIGHTBOX_SIDE_PANEL: 'shelter-feed-lightbox-side-panel',
  LOADING_STATE: 'shelter-feed-loading-state',
  ERROR_STATE: 'shelter-feed-error-state',
  ERROR_RETRY: 'shelter-feed-error-retry',
  ERROR_HOME: 'shelter-feed-error-home',
  EMPTY_STATE: 'shelter-feed-empty-state',
  EMPTY_REFRESH: 'shelter-feed-empty-refresh',
  FILTER_EMPTY_STATE: 'shelter-feed-filter-empty-state',
  FILTER_EMPTY_CLEAR: 'shelter-feed-filter-empty-clear',
  LOAD_MORE_BUTTON: 'shelter-feed-load-more-button',
  NEXT_PAGE_ERROR: 'shelter-feed-next-page-error',
  NEXT_PAGE_RETRY: 'shelter-feed-next-page-retry',
  SENTINEL: 'shelter-feed-sentinel',
  END_OF_FEED: 'shelter-feed-end',
} as const;
