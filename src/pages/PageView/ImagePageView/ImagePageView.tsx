import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Container, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/slices';
import { useShelterFeedSections } from '@/features/shelter-feed/useShelterFeedSections';
import { useFeedSentinel } from '@/features/shelter-feed/useFeedSentinel';
import SectionImagePageView from './SectionImagePageView';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import {
  PageViewEmpty,
  PageViewError,
  PageViewHero,
  PageViewLoading,
  PageViewType,
  formatCountLabel,
} from '@/components/common/page-view';
import { IMAGE_PAGE_VIEW_COPY, IMAGE_PAGE_VIEW_TEST_IDS } from './constants';
import { FofinhoButton } from './../../MemberArea/components';

interface PageSectionProps {
  idToFetch?: string;
  feed?: boolean;
}

export default function PageSectionView({ idToFetch, feed }: PageSectionProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const pageId = feed ? import.meta.env.VITE_FEED_MINISTERIO_ID : idToFetch;
  const {
    pageMeta: section,
    rawSections: sectionsList,
    isInitialLoading: loading,
    isFetchingNextPage: loadingMore,
    initialErrorMessage: error,
    hasNextPage,
    loadNextPage,
  } = useShelterFeedSections(pageId);

  const lastSectionRef = useFeedSentinel({
    enabled: hasNextPage && !loadingMore,
    onReach: loadNextPage,
  });

  if (loading) {
    return <PageViewLoading type={PageViewType.GALLERY} testId={IMAGE_PAGE_VIEW_TEST_IDS.LOADING} cardCount={2} />;
  }
  if (error) return <PageViewError testId={IMAGE_PAGE_VIEW_TEST_IDS.ERROR} message={error} />;
  if (!section) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <PageViewEmpty
          testId={IMAGE_PAGE_VIEW_TEST_IDS.NOT_FOUND}
          heading={IMAGE_PAGE_VIEW_COPY.NOT_FOUND_TITLE}
          body={IMAGE_PAGE_VIEW_COPY.NOT_FOUND_BODY}
        />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, md: 4 } }}
      data-testid="image-page-view"
    >
      <Box sx={{ mb: 4 }}>
        <PageViewHero
          type={PageViewType.GALLERY}
          icon={PhotoLibraryIcon}
          title={section.title}
          subtitle={section.subtitle}
          description={section.description}
          chips={[
            {
              key: 'sections',
              label: formatCountLabel(sectionsList.length, IMAGE_PAGE_VIEW_COPY.SECTION, IMAGE_PAGE_VIEW_COPY.SECTIONS),
            },
          ]}
          onBack={() => navigate(-1)}
          testIds={{
            root: IMAGE_PAGE_VIEW_TEST_IDS.HEADER,
            back: IMAGE_PAGE_VIEW_TEST_IDS.BACK,
          }}
        />
      </Box>

      <AnimatePresence>
        {sectionsList.length > 0 ? (
          <motion.div
            data-testid="image-page-sections"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {sectionsList.map((sectionItem, index) => (
              <motion.div
                key={sectionItem.id}
                data-testid="image-page-section"
                ref={index === sectionsList.length - 1 ? lastSectionRef : null}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{
                  marginBottom:
                    index < sectionsList.length - 1 ? theme.spacing(2) : 0,
                }}
              >
                <SectionImagePageView
                  caption={sectionItem.caption}
                  description={sectionItem.description}
                  mediaItems={sectionItem.mediaItems}
                  createdAt={
                    sectionItem.createdAt
                      ? new Date(sectionItem.createdAt)
                      : undefined
                  }
                  updatedAt={
                    sectionItem.updatedAt
                      ? new Date(sectionItem.updatedAt)
                      : undefined
                  }
                />
              </motion.div>
            ))}

            {loadingMore && (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                py={4}
              >
                <CircularProgress size={40} />
              </Box>
            )}

            {feed && isAuthenticated && (
              <Box mt={4}>
                <FofinhoButton references={['photos']} />
              </Box>
            )}
          </motion.div>
        ) : (
          <PageViewEmpty
            testId={IMAGE_PAGE_VIEW_TEST_IDS.EMPTY}
            heading={IMAGE_PAGE_VIEW_COPY.EMPTY_TITLE}
            body={IMAGE_PAGE_VIEW_COPY.EMPTY_BODY}
          />
        )}
      </AnimatePresence>
    </Container>
  );
}
