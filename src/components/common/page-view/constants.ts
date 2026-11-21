import { PageViewType, type PageViewAccent } from './types';

export const PAGE_VIEW_ACCENTS: Record<PageViewType, PageViewAccent> = {
  [PageViewType.GALLERY]: { color: '#2e7d32', gradientFrom: '#4caf50', gradientTo: '#2e7d32' },
  [PageViewType.VIDEOS]: { color: '#d84315', gradientFrom: '#ff5722', gradientTo: '#d32f2f' },
  [PageViewType.IDEAS]: { color: '#7b1fa2', gradientFrom: '#9c27b0', gradientTo: '#6a1b9a' },
};

/** Alvo mínimo de toque (px). */
export const PAGE_VIEW_MIN_TOUCH_TARGET = 44;

export const PAGE_VIEW_DEFAULT_SKELETON_CARDS = 3;
export const PAGE_VIEW_MAX_SKELETON_CARDS = 12;

export const PAGE_VIEW_COPY = {
  BACK: 'Voltar',
} as const;
