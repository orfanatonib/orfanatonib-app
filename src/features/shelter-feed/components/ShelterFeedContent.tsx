import { Box, Stack } from '@mui/material';
import { FEED_TEST_IDS } from '../constants';
import { groupSectionsByMonth } from '../feedData.utils';
import { FeedViewMode, type FeedSectionViewModel } from '../types';
import type { useShelterFeedView } from '../useShelterFeedView';
import { FeedBentoMural } from './FeedBentoMural';
import { FeedPhotoWall } from './FeedPhotoWall';
import { FeedPostCard } from './FeedPostCard';
import { FeedTimelineRail } from './FeedTimelineRail';

interface ShelterFeedContentProps {
  view: ReturnType<typeof useShelterFeedView>;
  canUploadPhotos: boolean;
  onNavigateUpload: () => void;
}

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

/** Corpo do feed conforme o modo: Publicações (cartões + índice), Momentos (mosaico) ou Fotos e vídeos. */
export function ShelterFeedContent({ view, canUploadPhotos, onNavigateUpload }: ShelterFeedContentProps) {
  const { viewMode, visibleSections, visiblePhotos, copiedSectionId, activeSectionId } = view;
  const groups = groupSectionsByMonth(visibleSections);

  if (viewMode === FeedViewMode.BENTO) {
    return <FeedBentoMural groups={groups} onOpenLightbox={view.openLightbox} />;
  }
  if (viewMode === FeedViewMode.GALLERY) {
    return <FeedPhotoWall photos={visiblePhotos} onSelectPhoto={view.selectPhoto} />;
  }
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 290px' },
        gap: { xs: 2.5, md: 3 },
        alignItems: 'start',
      }}
    >
      <Stack data-testid={FEED_TEST_IDS.TIMELINE_STREAM} spacing={{ xs: 2.5, sm: 3.5 }} sx={{ minWidth: 0 }}>
        {visibleSections.map((section: FeedSectionViewModel) => (
          <FeedPostCard
            key={section.id}
            section={section}
            isCopied={copiedSectionId === section.id}
            onShare={(target, mediaIndex) => void view.shareSection(target, mediaIndex)}
            onOpenLightbox={view.openLightbox}
          />
        ))}
      </Stack>
      <FeedTimelineRail
        groups={groups}
        activeSectionId={activeSectionId}
        canUploadPhotos={canUploadPhotos}
        onJumpToSection={view.jumpToSection}
        onNavigateUpload={onNavigateUpload}
        onScrollTop={scrollToTop}
      />
    </Box>
  );
}
