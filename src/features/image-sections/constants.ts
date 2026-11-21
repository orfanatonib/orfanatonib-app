import { MediaType } from '@/store/slices/types';

/** Caminho base dos endpoints de fotos e vídeos dos abrigos. */
export const IMAGE_SECTIONS_ENDPOINT = '/image-sections';

/** Campo do multipart que carrega o JSON da publicação. */
export const IMAGE_SECTION_PAYLOAD_FIELD = 'sectionData';

/** Fotos por publicação (mesma cota da API). */
export const SHELTER_MAX_PHOTOS = 10;
/** Vídeos por publicação (mesma cota da API). */
export const SHELTER_MAX_VIDEOS = 1;
export const SHELTER_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const SHELTER_MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const SHELTER_CAPTION_MAX_LENGTH = 255;

/** Envio de vídeo pode demorar em rede móvel. */
export const SHELTER_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

/** MIME => extensões aceitas no nome do arquivo. */
export const SHELTER_IMAGE_FORMATS: Readonly<Record<string, readonly string[]>> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
};
export const SHELTER_VIDEO_FORMATS: Readonly<Record<string, readonly string[]>> = {
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov'],
};
export const SHELTER_IMAGE_ACCEPT = Object.keys(SHELTER_IMAGE_FORMATS).join(',');
export const SHELTER_VIDEO_ACCEPT = Object.keys(SHELTER_VIDEO_FORMATS).join(',');

/** Tipos de mídia que um post aceita. */
export const SHELTER_POST_MEDIA_TYPES: readonly MediaType[] = [MediaType.IMAGE, MediaType.VIDEO];

/** Alvo mínimo de toque (px). */
export const TOUCH_TARGET_PX = 44;

/** Rota do feed que o sucesso do envio oferece. */
export const SHELTER_FEED_ROUTE = '/feed-abrigos';

export const SHELTER_UPLOAD_MESSAGES = {
  TITLE_REQUIRED: 'Preencha o título da publicação.',
  DESCRIPTION_REQUIRED: 'Conte um pouco sobre essa visita na descrição.',
  MEDIA_REQUIRED: 'Adicione fotos ou um vídeo para compartilhar.',
  ONE_VIDEO: 'Envie apenas um vídeo por publicação. Remova o atual para escolher outro.',
  MAX_PHOTOS: `Selecione no máximo ${SHELTER_MAX_PHOTOS} fotos por publicação.`,
  COMPOSITION: `Envie até ${SHELTER_MAX_PHOTOS} fotos e um único vídeo por publicação.`,
  PHOTO_FORMAT: 'Escolha fotos JPG, PNG, WebP ou GIF.',
  VIDEO_FORMAT: 'Escolha um vídeo MP4, WebM ou MOV.',
  PHOTO_SIZE: 'Cada foto deve ter até 10 MB e não pode estar vazia.',
  VIDEO_SIZE: 'O vídeo deve ter até 100 MB e não pode estar vazio.',
  SEND_FAILED: 'Não foi possível enviar. Seus arquivos continuam aqui para tentar novamente.',
  VIDEO_UNPLAYABLE: 'Não foi possível reproduzir este vídeo.',
} as const;

/** Fila de revisão do admin. */
export const ADMIN_IMAGE_SECTIONS_ROUTE = '/adm/fotos-abrigos';
/** Tela de revisão de um post. */
export const ADMIN_IMAGE_SECTION_EDIT_ROUTE = '/adm/editar-imagens-shelter';

/** Motivo da reprovação (mesmo teto da API). */
export const REJECTION_REASON_MAX_LENGTH = 500;

export const REJECTION_MESSAGES = {
  REASON_REQUIRED: 'Informe o motivo da reprovação.',
  FAILED: 'Não foi possível reprovar. Tente novamente.',
} as const;

/** Rótulo e cor de cada estado, para os chips do admin e do autor. */
export const REVIEW_STATUS_LABELS: Readonly<Record<string, string>> = {
  pending: 'Aguardando aprovação',
  approved: 'Aprovada',
  rejected: 'Reprovada',
};
export const REVIEW_STATUS_COLORS: Readonly<Record<string, 'warning' | 'success' | 'error'>> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

/** Fila de revisão: o selo do painel atualiza sozinho e some com a flag. */
export const IMAGE_SECTIONS_PENDING_COUNT_ENDPOINT = `${IMAGE_SECTIONS_ENDPOINT}/pending-count`;
export const IMAGE_SECTIONS_PENDING_POLL_MS = 60_000;
export const IMAGE_SECTIONS_STALE_TIME_MS = 15_000;
export const IMAGE_SECTIONS_PENDING_BADGE_MAX = 99;
export const IMAGE_SECTIONS_PENDING_BADGE_ARIA = 'publicações de fotos aguardando aprovação';

/** Chaves do cache de servidor da feature (todas dentro de `image-sections`). */
export const imageSectionKeys = {
  root: ['image-sections'] as const,
  pendingCount: (userId: string | null) => ['image-sections', 'pending-count', userId] as const,
};

export const IMAGE_SECTION_TEST_IDS = {
  PENDING_BADGE: 'image-sections-pending-badge',
  MANAGER: 'image-sections-manager',
  SEARCH: 'image-sections-search',
  SEARCH_CLEAR: 'image-sections-search-clear',
  REFRESH: 'image-sections-refresh',
  LOADING: 'image-sections-loading',
  ERROR: 'image-sections-error',
  EMPTY: 'image-sections-empty',
  LIST: 'image-sections-list',
  DELETE_DIALOG: 'image-section-delete-dialog',
} as const;

export const IMAGE_SECTIONS_MESSAGES = {
  TITLE: '📸 Imagens dos Abrigos',
  EMPTY: 'Ainda não há publicações de fotos dos abrigos aguardando revisão.',
  LOAD_FAILED: 'Erro ao buscar seções de imagens',
  DELETE_FAILED: 'Erro ao deletar seção de imagens',
} as const;
