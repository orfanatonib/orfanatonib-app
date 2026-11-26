import { PAGE_VIEW_ACCENTS, PAGE_VIEW_DEFAULT_SKELETON_CARDS, PAGE_VIEW_MAX_SKELETON_CARDS } from './constants';
import type { PageViewAccent, PageViewType } from './types';

export function getPageViewAccent(type: PageViewType): PageViewAccent {
  return PAGE_VIEW_ACCENTS[type];
}

export function buildHeroGradient(accent: PageViewAccent): string {
  return `linear-gradient(135deg, ${accent.gradientFrom} 0%, ${accent.gradientTo} 100%)`;
}

export function formatCountLabel(count: number, singular: string, plural: string): string {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return `${safe} ${safe === 1 ? singular : plural}`;
}

export function resolveSkeletonCount(count?: number): number {
  if (count === undefined || !Number.isFinite(count)) return PAGE_VIEW_DEFAULT_SKELETON_CARDS;
  return Math.min(PAGE_VIEW_MAX_SKELETON_CARDS, Math.max(0, Math.floor(count)));
}
