import { buildSectionShareUrl } from './feedLayout.utils';
import { FEED_PAGE_MESSAGES } from './constants';
import { ShareResultKind, type FeedSectionViewModel } from './types';

/** Compartilha a publicação (e a mídia indicada) pela Web Share API; sem ela, copia o link direto. */
export async function shareFeedSection(
  section: FeedSectionViewModel,
  mediaIndex = 0,
): Promise<ShareResultKind> {
  if (typeof window === 'undefined') return ShareResultKind.FAILED;
  const url = buildSectionShareUrl(
    window.location.origin,
    window.location.pathname,
    window.location.search,
    section.id,
    section.mediaCount > 0 ? mediaIndex : undefined,
  );

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: `${section.caption} · ${FEED_PAGE_MESSAGES.PUBLISHER}`,
        text: section.description || section.caption,
        url,
      });
      return ShareResultKind.SHARED_NATIVE;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return ShareResultKind.ABORTED;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return ShareResultKind.COPIED_LINK;
  } catch {
    return ShareResultKind.FAILED;
  }
}
