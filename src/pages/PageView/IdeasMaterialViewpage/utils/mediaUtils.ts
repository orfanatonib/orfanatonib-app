import { Theme } from "@mui/material/styles";

export type MediaType = "videos" | "documents" | "images";

export interface MediaItem {
  id: string;
  mediaType: "video" | "document" | "image";
  [key: string]: any;
}

/**
 * Filtra mídias por tipo
 */
export function filterMediaByType(medias: MediaItem[], type: "video" | "document" | "image"): MediaItem[] {
  return medias.filter((media) => media.mediaType === type);
}

/**
 * Retorna a cor do tema para cada tipo de mídia
 */
export function getMediaColor(type: MediaType, theme: Theme): string {
  const colorMap: Record<MediaType, string> = {
    videos: theme.palette.error.main,
    documents: theme.palette.success.main,
    images: theme.palette.warning.main,
  };
  return colorMap[type];
}

/**
 * Retorna o emoji para cada tipo de mídia
 */
export function getMediaEmoji(type: MediaType): string {
  const emojiMap: Record<MediaType, string> = {
    videos: "🎬",
    documents: "📄",
    images: "🖼️",
  };
  return emojiMap[type];
}

/**
 * Retorna o label em português para cada tipo de mídia
 */
export function getMediaLabel(type: MediaType): string {
  const labelMap: Record<MediaType, string> = {
    videos: "Vídeos",
    documents: "Documentos",
    images: "Imagens",
  };
  return labelMap[type];
}

/**
 * Agrupa as mídias de uma seção por tipo
 */
export function groupSectionMedias(medias: MediaItem[]) {
  return {
    videos: filterMediaByType(medias, "video"),
    documents: filterMediaByType(medias, "document"),
    images: filterMediaByType(medias, "image"),
  };
}
