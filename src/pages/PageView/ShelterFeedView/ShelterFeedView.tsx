import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Container } from '@mui/material';
import { FeatureFlagKeys, useIsFeatureEnabled } from '@/features/feature-flags';
import {
  FEED_CONTAINER_WIDTH,
  FEED_CONTENT_MAX_WIDTH,
  FEED_PAGE_MESSAGES,
  FEED_PALETTE,
  FEED_ROUTES,
  FEED_TEST_IDS,
} from '@/features/shelter-feed/constants';
import type { ShelterFeedViewProps } from '@/features/shelter-feed/componentTypes';
import { FeedControlBar } from '@/features/shelter-feed/components/FeedControlBar';
import { FeedEmptyState, FeedErrorState, FeedLoadingSkeleton } from '@/features/shelter-feed/components/FeedStates';
import { FeedFilterEmptyState, FeedPaginationFooter } from '@/features/shelter-feed/components/FeedListStates';
import { FeedHeroBanner } from '@/features/shelter-feed/components/FeedHeroBanner';
import { FeedLightboxDialog } from '@/features/shelter-feed/components/FeedLightboxDialog';
import { FeedHighlightsCarousel } from '@/features/shelter-feed/components/FeedHighlightsCarousel';
import { ShelterFeedContent } from '@/features/shelter-feed/components/ShelterFeedContent';
import { resolveFeedPageId } from '@/features/shelter-feed/utils';
import { useShelterFeedView } from '@/features/shelter-feed/useShelterFeedView';
import type { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';

/** Tela do feed dos abrigos (`SHELTER_FEED_PATH`): só compõe; dados e regras ficam na feature. */
export default function ShelterFeedView({ feed = true }: ShelterFeedViewProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const photoUploadOn = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_PHOTO_UPLOAD);

  const configuredId: string | undefined = import.meta.env.VITE_FEED_MINISTERIO_ID?.trim() || undefined;
  const pageId = feed ? resolveFeedPageId(searchParams.get('galeria'), configuredId) : undefined;
  const view = useShelterFeedView(pageId);

  const canUploadPhotos = isAuthenticated && photoUploadOn;
  const canManageFeed = isAuthenticated && user?.role === UserRole.ADMIN;
  const goHome = () => navigate(FEED_ROUTES.HOME);
  const goUpload = () => navigate(FEED_ROUTES.UPLOAD_PHOTOS);
  const refresh = () => void view.refreshFeed();

  const rootSx = { minHeight: '100vh', bgcolor: FEED_PALETTE.canvas, pb: { xs: 5, md: 8 }, overflowX: 'clip' } as const;

  if (!pageId || view.initialErrorMessage) {
    return (
      <Box data-testid={FEED_TEST_IDS.PAGE_ROOT} sx={rootSx}>
        <FeedErrorState
          message={!pageId ? FEED_PAGE_MESSAGES.MISSING_CONFIG : (view.initialErrorMessage ?? FEED_PAGE_MESSAGES.LOAD_ERROR)}
          isRetrying={view.isRefreshing}
          onRetry={refresh}
          onNavigateHome={goHome}
        />
      </Box>
    );
  }

  if (view.isInitialLoading) {
    return (
      <Box data-testid={FEED_TEST_IDS.PAGE_ROOT} sx={rootSx}>
        <FeedLoadingSkeleton />
      </Box>
    );
  }

  const hasSections = view.sections.length > 0;
  return (
    <Box data-testid={FEED_TEST_IDS.PAGE_ROOT} sx={rootSx}>
      <FeedHeroBanner
        title={FEED_PAGE_MESSAGES.DEFAULT_TITLE}
        description={view.pageMeta?.description || FEED_PAGE_MESSAGES.DEFAULT_SUBTITLE}
        totalSections={view.totalSections}
        canUploadPhotos={canUploadPhotos}
        canManageFeed={canManageFeed}
        isRefreshing={view.isRefreshing}
        onNavigateHome={goHome}
        onNavigateUpload={goUpload}
        onNavigateManage={() => navigate(FEED_ROUTES.ADMIN_MEDIA)}
        onRefresh={refresh}
      />
      <Container
        data-testid={FEED_TEST_IDS.CONTENT}
        maxWidth={false}
        disableGutters
        sx={{ width: FEED_CONTAINER_WIDTH, maxWidth: FEED_CONTENT_MAX_WIDTH, mx: 'auto' }}
      >
        {!hasSections ? (
          <Box sx={{ pt: { xs: 4, md: 6 } }}>
            <FeedEmptyState
              canUploadPhotos={canUploadPhotos}
              isRefreshing={view.isRefreshing}
              onRefresh={refresh}
              onNavigateUpload={goUpload}
            />
          </Box>
        ) : (
          <>
            <FeedHighlightsCarousel
              sections={view.sections}
              viewedStoryIds={view.viewedStoryIds}
              onSelectStory={(section) => view.openLightbox(section, 0)}
            />
            <FeedControlBar
              viewMode={view.viewMode}
              searchQuery={view.searchQuery}
              visibleCount={view.visibleSections.length}
              loadedCount={view.sections.length}
              totalPhotosCount={view.visiblePhotos.length}
              onViewModeChange={view.setViewMode}
              onSearchChange={view.setSearchQuery}
              onClearSearch={() => view.setSearchQuery('')}
            />
            {view.visibleSections.length === 0 ? (
              <FeedFilterEmptyState onClear={() => view.setSearchQuery('')} />
            ) : (
              <ShelterFeedContent
                view={view}
                canUploadPhotos={canUploadPhotos}
                onNavigateUpload={goUpload}
              />
            )}
            <FeedPaginationFooter
              hasNextPage={view.hasNextPage}
              isFetchingNextPage={view.isFetchingNextPage}
              nextPageErrorMessage={view.nextPageErrorMessage}
              showEnd={!view.hasNextPage && !view.hasSearchFilter && view.visibleSections.length > 0}
              sentinelRef={view.sentinelRef}
              onLoadMore={view.loadNextPage}
            />
          </>
        )}
      </Container>
      <FeedLightboxDialog
        activeState={view.activeLightbox}
        isCopied={view.activeLightbox !== null && view.copiedSectionId === view.activeLightbox.section.id}
        onShare={(section, mediaIndex) => void view.shareSection(section, mediaIndex)}
        onClose={view.closeLightbox}
      />
    </Box>
  );
}
