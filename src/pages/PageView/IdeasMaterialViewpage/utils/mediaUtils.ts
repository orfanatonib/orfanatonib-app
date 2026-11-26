import type { MediaItem } from '@/store/slices/types';
import { IDEA_MEDIA_GROUPS_CONFIG } from '../constants';
import type { IdeaMediaGroup } from '../types';

/** Mídias da seção agrupadas por tipo, na ordem de exibição, sem os grupos vazios. */
export function groupSectionMedias(medias: readonly MediaItem[]): IdeaMediaGroup[] {
  return IDEA_MEDIA_GROUPS_CONFIG.map((config) => ({
    ...config,
    items: medias.filter((media) => media.mediaType === config.mediaType),
  })).filter((group) => group.items.length > 0);
}

/** Chave estável de uma mídia; a API pode devolver mídia sem id. */
export const mediaKey = (media: MediaItem, sectionIndex: number, mediaIndex: number): string =>
  media.id ?? `${sectionIndex}-${mediaIndex}`;
