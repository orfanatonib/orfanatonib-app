import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import { MediaType } from '@/store/slices/types';

export const formatPtBrDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('pt-BR') : 'Não disponível';

export const truncate = (text: string, max = 100) =>
  text.length > max ? text.slice(0, max) + '...' : text;

/** Total de mídias de todas as seções da página. */
export const countMedias = (page: IdeasPageData): number =>
  (page.sections ?? []).reduce((total, section) => total + (section.medias?.length ?? 0), 0);

/** Primeira imagem enviada (ou com link) das seções, usada como capa do cartão. */
export const coverImageUrl = (page: IdeasPageData): string | undefined => {
  for (const section of page.sections ?? []) {
    const image = (section.medias ?? []).find((media) => media.mediaType === MediaType.IMAGE && media.url);
    if (image) return image.url;
  }
  return undefined;
};
