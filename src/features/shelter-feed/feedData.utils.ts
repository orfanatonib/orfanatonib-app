import { MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';
import {
  FEED_INITIAL_PAGE,
  FEED_MAX_PAGE_SIZE,
  FEED_PAGE_MESSAGES,
  FEED_SECTIONS_PAGE_SIZE,
  PT_BR_MONTH_NAMES,
  PT_BR_SHORT_MONTH_NAMES,
} from './constants';
import { buildSectionAnchorId } from './feedLayout.utils';
import type {
  FeedMediaItemDto,
  FeedMediaViewModel,
  FeedMonthGroup,
  FeedPageDto,
  FeedPhotoWallItem,
  FeedSectionData,
  FeedSectionViewModel,
  MergedFeedPages,
  QueryFeedSectionsParams,
} from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const UNKNOWN_MONTH_KEY = 'sem-data';

/** Monta exatamente os parâmetros aceitos pela API (página >= 1, lote entre 1 e 50). */
export function buildFeedSectionsQuery(
  page: number = FEED_INITIAL_PAGE,
  limit: number = FEED_SECTIONS_PAGE_SIZE,
): QueryFeedSectionsParams {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : FEED_INITIAL_PAGE;
  const safeLimit =
    Number.isFinite(limit) && limit >= 1 ? Math.min(Math.floor(limit), FEED_MAX_PAGE_SIZE) : FEED_SECTIONS_PAGE_SIZE;
  return { page: safePage, limit: safeLimit };
}

export function hasNextFeedPage(pageDto: Pick<FeedPageDto, 'page' | 'limit' | 'total'>): boolean {
  return pageDto.page * pageDto.limit < pageDto.total;
}

/** Consolida as páginas do `useInfiniteQuery` deduplicando seções por `id` (mantém a 1ª ocorrência). */
export function mergeFeedPages(pages: ReadonlyArray<FeedPageDto> | undefined): MergedFeedPages {
  if (!pages || pages.length === 0) return { pageMeta: null, sections: [], total: 0 };
  const { sections: _first, ...firstMeta } = pages[0];
  const latest = pages[pages.length - 1];
  const seen = new Set<string>();
  const sections: FeedSectionData[] = [];
  for (const page of pages) {
    for (const section of page.sections ?? []) {
      if (!section?.id || seen.has(section.id)) continue;
      seen.add(section.id);
      sections.push(section);
    }
  }
  return {
    pageMeta: { ...firstMeta, page: latest.page, total: latest.total },
    sections,
    total: latest.total,
  };
}

function extractGoogleDriveThumbnailUrl(url: string): string | null {
  const match = url.match(/\/d\/([^/]+)\//);
  return match?.[1] ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600` : null;
}

/** URL de exibição de uma mídia, sem mutar o DTO. */
export function resolveFeedMediaPreviewUrl(media: FeedMediaItemDto): string {
  const rawUrl = (media.url ?? '').trim();
  if (!rawUrl) return '';
  if (media.mediaType === MediaType.VIDEO) return rawUrl;
  if (media.uploadType === MediaUploadType.UPLOAD || media.isLocalFile) return rawUrl;
  if (media.uploadType === MediaUploadType.LINK) {
    switch (media.platformType) {
      case MediaPlatform.GOOGLE_DRIVE:
        return extractGoogleDriveThumbnailUrl(rawUrl) ?? rawUrl;
      case MediaPlatform.DROPBOX:
        return rawUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      case MediaPlatform.ONEDRIVE:
        return rawUrl.replace('redir?', 'embed?');
      default:
        return rawUrl;
    }
  }
  return rawUrl;
}

/** Remove acentos e normaliza a caixa para a busca em português. */
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Iniciais (até 2) do nome do autor ou do título, para o selo do cartão. */
export function buildMonogram(source: string): string {
  const words = source.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'NIB';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function formatFeedDateParts(isoValue?: string | null): {
  fullDate: string;
  time: string;
  isValid: boolean;
} {
  const parsed = isoValue ? new Date(isoValue) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return { fullDate: '—', time: '', isValid: false };
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return {
    fullDate: `${parsed.getDate()} de ${PT_BR_MONTH_NAMES[parsed.getMonth()]} de ${parsed.getFullYear()}`,
    time: `${hours}:${minutes}`,
    isValid: true,
  };
}

/** "Hoje", "Ontem", "Há N dias" ou data curta. */
export function formatRelativeFeedDate(isoValue?: string | null, referenceDate: Date = new Date()): string {
  const parsed = isoValue ? new Date(isoValue) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return 'Recente';
  const startOfTarget = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const startOfRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const diffDays = Math.round((startOfRef.getTime() - startOfTarget.getTime()) / MS_PER_DAY);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays > 1 && diffDays <= 7) return `Há ${diffDays} dias`;
  const base = `${parsed.getDate()} ${PT_BR_SHORT_MONTH_NAMES[parsed.getMonth()]}`;
  return parsed.getFullYear() === referenceDate.getFullYear() ? base : `${base} ${parsed.getFullYear()}`;
}

/** Mapeia a seção da API para o modelo consumido pelos componentes visuais. */
export function toFeedSectionViewModel(dto: FeedSectionData, referenceDate: Date = new Date()): FeedSectionViewModel {
  const caption = dto.caption?.trim() || FEED_PAGE_MESSAGES.UNTITLED_SECTION;
  const mediaItems: FeedMediaViewModel[] = (dto.mediaItems ?? [])
    .map((item, idx) => {
      const previewUrl = resolveFeedMediaPreviewUrl(item);
      return {
        key: item.id ? `${dto.id}-${item.id}` : `${dto.id}-media-${idx}`,
        id: item.id,
        title:
          item.title?.trim() || `${caption} — ${item.mediaType === MediaType.VIDEO ? 'Vídeo' : 'Foto'} ${idx + 1}`,
        description: item.description?.trim() || '',
        previewUrl,
        mediaType: item.mediaType,
        originalUrl: (item.url ?? '').trim() || previewUrl,
        platformType: item.platformType ?? MediaPlatform.ANY,
        uploadType: item.uploadType ?? MediaUploadType.UPLOAD,
        isLocalFile: Boolean(item.isLocalFile),
      };
    })
    .filter((item) => Boolean(item.previewUrl));
  const created = formatFeedDateParts(dto.createdAt);
  return {
    id: dto.id,
    anchorId: buildSectionAnchorId(dto.id),
    caption,
    description: dto.description?.trim() || '',
    isPublic: dto.public,
    monogram: buildMonogram(dto.author?.displayName || caption),
    isVideo: mediaItems.some((item) => item.mediaType === MediaType.VIDEO),
    formattedDate: created.fullDate,
    formattedTime: created.time,
    relativeDate: formatRelativeFeedDate(dto.createdAt, referenceDate),
    createdAtIso: created.isValid ? (dto.createdAt ?? null) : null,
    mediaItems,
    // Capa = primeira FOTO (a URL de um .mp4 não serve de imagem); só com vídeos a capa fica vazia.
    coverUrl: mediaItems.find((item) => item.mediaType !== MediaType.VIDEO)?.previewUrl ?? '',
    mediaCount: mediaItems.length,
    author: dto.author ?? null,
    celebrationCount: dto.celebrationCount ?? 0,
    celebratedByMe: dto.celebratedByMe ?? false,
    commentCount: dto.commentCount ?? 0,
  };
}

/** Filtra as publicações já carregadas por título, texto ou data (sem acentos). */
export function filterFeedSections(
  sections: ReadonlyArray<FeedSectionViewModel>,
  rawQuery: string,
): FeedSectionViewModel[] {
  const query = normalizeSearchText(rawQuery);
  if (!query) return [...sections];
  return sections.filter((section) =>
    normalizeSearchText(`${section.caption} ${section.description} ${section.formattedDate}`).includes(query),
  );
}

/** Achata todas as mídias das publicações visíveis para o modo "Fotos e vídeos". */
export function flattenFeedPhotos(sections: ReadonlyArray<FeedSectionViewModel>): FeedPhotoWallItem[] {
  return sections.flatMap((section) =>
    section.mediaItems.map((media, index) => ({
      key: media.key,
      sectionId: section.id,
      sectionCaption: section.caption,
      mediaType: media.mediaType,
      formattedDate: section.relativeDate,
      mediaIndex: index,
      totalInSection: section.mediaCount,
      previewUrl: media.previewUrl,
      altText: media.title || `${section.caption} — Foto ${index + 1}`,
    })),
  );
}

/** Agrupa por mês de criação, preservando a ordem (mais recentes primeiro) da lista recebida. */
export function groupSectionsByMonth(sections: ReadonlyArray<FeedSectionViewModel>): FeedMonthGroup[] {
  const groups = new Map<string, FeedMonthGroup>();
  for (const section of sections) {
    const date = section.createdAtIso ? new Date(section.createdAtIso) : null;
    const valid = date !== null && !Number.isNaN(date.getTime());
    const key = valid ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : UNKNOWN_MONTH_KEY;
    const label = valid ? `${PT_BR_MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}` : 'Sem data';
    const group = groups.get(key) ?? { key, label, sections: [] };
    group.sections.push(section);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}
