import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FEED_COPY_FEEDBACK_DURATION_MS, FEED_DEEP_LINK_MAX_EXTRA_PAGES } from './constants';
import { filterFeedSections, flattenFeedPhotos } from './feedData.utils';
import { parseSectionAnchorHash, parseSharedMediaIndex, stripSharedMediaParam } from './feedLayout.utils';
import { shareFeedSection } from './share';
import {
  FeedViewMode,
  ShareResultKind,
  type ActiveLightboxState,
  type FeedPhotoWallItem,
  type FeedSectionViewModel,
} from './types';
import { useFeedSentinel } from './useFeedSentinel';
import { useShelterFeedSections } from './useShelterFeedSections';

/**
 * Orquestra a tela do feed: dados (um único dono), modo, busca, lightbox,
 * compartilhar, destaque no índice lateral e deep link `#publicacao-feed-<id>`.
 */
export function useShelterFeedView(pageId: string | undefined) {
  const feed = useShelterFeedSections(pageId);
  const { sections, hasNextPage, isFetchingNextPage, nextPageErrorMessage, loadNextPage } = feed;

  const [viewMode, setViewMode] = useState<FeedViewMode>(FeedViewMode.TIMELINE);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLightbox, setActiveLightbox] = useState<ActiveLightboxState | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [viewedStoryIds, setViewedStoryIds] = useState<ReadonlySet<string>>(() => new Set());
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deepLinkRef = useRef<string | null>(
    typeof window === 'undefined' ? null : parseSectionAnchorHash(window.location.hash),
  );
  const sharedMediaRef = useRef<number | null>(
    typeof window === 'undefined' ? null : parseSharedMediaIndex(window.location.search),
  );
  const extraPagesRef = useRef(0);

  const hasSearchFilter = searchQuery.trim().length > 0;
  const visibleSections = useMemo(() => filterFeedSections(sections, searchQuery), [sections, searchQuery]);
  const visiblePhotos = useMemo(() => flattenFeedPhotos(visibleSections), [visibleSections]);
  const sectionsById = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  // Deep link: busca páginas (com teto) até achar a publicação e rola até ela.
  useEffect(() => {
    const anchor = deepLinkRef.current;
    if (!anchor || sections.length === 0) return;
    const target = sections.find((section) => section.anchorId === anchor);
    if (target) {
      deepLinkRef.current = null;
      setViewMode(FeedViewMode.TIMELINE);
      setSearchQuery('');
      setActiveSectionId(target.id);
      const sharedMedia = sharedMediaRef.current;
      sharedMediaRef.current = null;
      requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'auto', block: 'start' });
        if (sharedMedia !== null && target.mediaCount > 0) {
          setActiveLightbox({ section: target, initialIndex: Math.min(sharedMedia, target.mediaCount - 1) });
        }
      });
      return;
    }
    if (!hasNextPage || nextPageErrorMessage || extraPagesRef.current >= FEED_DEEP_LINK_MAX_EXTRA_PAGES) {
      deepLinkRef.current = null;
      return;
    }
    if (!isFetchingNextPage) {
      extraPagesRef.current += 1;
      loadNextPage();
    }
  }, [sections, hasNextPage, isFetchingNextPage, nextPageErrorMessage, loadNextPage]);

  // Destaca no índice lateral a publicação visível.
  useEffect(() => {
    if (viewMode !== FeedViewMode.TIMELINE || visibleSections.length === 0) return;
    const elements = visibleSections
      .map((section) => document.getElementById(section.anchorId))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        const matched = hit && visibleSections.find((section) => section.anchorId === hit.target.id);
        if (matched) setActiveSectionId(matched.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.05 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [viewMode, visibleSections]);

  const sentinelRef = useFeedSentinel({
    enabled: !hasSearchFilter && hasNextPage && !isFetchingNextPage && !nextPageErrorMessage,
    onReach: loadNextPage,
  });

  const openLightbox = useCallback((section: FeedSectionViewModel, mediaIndex = 0) => {
    setViewedStoryIds((prev) => (prev.has(section.id) ? prev : new Set(prev).add(section.id)));
    if (section.mediaCount === 0) return;
    setActiveLightbox({ section, initialIndex: mediaIndex });
  }, []);

  const closeLightbox = useCallback(() => {
    setActiveLightbox(null);
    const { pathname, search, hash } = window.location;
    const cleaned = stripSharedMediaParam(search);
    if (cleaned !== search) window.history.replaceState(window.history.state, '', `${pathname}${cleaned}${hash}`);
  }, []);

  const selectPhoto = useCallback(
    (photo: FeedPhotoWallItem) => {
      const parent = sectionsById.get(photo.sectionId);
      if (parent) openLightbox(parent, photo.mediaIndex);
    },
    [sectionsById, openLightbox],
  );

  const jumpToSection = useCallback((section: FeedSectionViewModel) => {
    setActiveSectionId(section.id);
    document.getElementById(section.anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const shareSection = useCallback(async (section: FeedSectionViewModel, mediaIndex = 0) => {
    const result = await shareFeedSection(section, mediaIndex);
    if (result !== ShareResultKind.COPIED_LINK) return;
    setCopiedSectionId(section.id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedSectionId(null), FEED_COPY_FEEDBACK_DURATION_MS);
  }, []);

  return {
    ...feed,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    hasSearchFilter,
    visibleSections,
    visiblePhotos,
    activeLightbox,
    activeSectionId,
    copiedSectionId,
    viewedStoryIds,
    sentinelRef,
    openLightbox,
    closeLightbox,
    selectPhoto,
    jumpToSection,
    shareSection,
  };
}
