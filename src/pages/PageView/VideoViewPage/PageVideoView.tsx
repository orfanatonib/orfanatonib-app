import { useNavigate } from "react-router-dom";
import { Container, Grid } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import VideoCard from "./VideoCard";
import VideocamIcon from "@mui/icons-material/Videocam";
import {
  PageViewEmpty,
  PageViewError,
  PageViewHero,
  PageViewLoading,
  PageViewType,
  formatCountLabel,
} from "@/components/common/page-view";
import { VIDEO_PAGE_VIEW_COPY, VIDEO_PAGE_VIEW_TEST_IDS } from "./constants";
import { useVideoPage } from "./hooks";

interface VideoPageViewProps {
  idToFetch: string
}

export default function PageVideoView({ idToFetch }: VideoPageViewProps) {
  const navigate = useNavigate();
  const { videoData, loading, error } = useVideoPage(idToFetch);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) return <PageViewLoading type={PageViewType.VIDEOS} testId={VIDEO_PAGE_VIEW_TEST_IDS.LOADING} cardCount={3} />;
  if (error) return <PageViewError testId={VIDEO_PAGE_VIEW_TEST_IDS.ERROR} message={error} />;
  if (!videoData) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <PageViewEmpty
          testId={VIDEO_PAGE_VIEW_TEST_IDS.NOT_FOUND}
          heading={VIDEO_PAGE_VIEW_COPY.NOT_FOUND_TITLE}
          body={VIDEO_PAGE_VIEW_COPY.NOT_FOUND_BODY}
        />
      </Container>
    );
  }

  const totalVideos = videoData.videos?.length || 0;

  return (
    <Container maxWidth="xl" data-testid={VIDEO_PAGE_VIEW_TEST_IDS.VIEW} sx={{ py: { xs: 2, md: 4 } }}>
      <PageViewHero
        type={PageViewType.VIDEOS}
        icon={VideocamIcon}
        title={videoData.title}
        description={videoData.description}
        chips={[
          {
            key: 'videos',
            label: formatCountLabel(totalVideos, VIDEO_PAGE_VIEW_COPY.VIDEO, VIDEO_PAGE_VIEW_COPY.VIDEOS),
          },
        ]}
        onBack={handleBack}
        testIds={{
          back: VIDEO_PAGE_VIEW_TEST_IDS.BACK,
          title: VIDEO_PAGE_VIEW_TEST_IDS.TITLE,
          description: VIDEO_PAGE_VIEW_TEST_IDS.DESCRIPTION,
        }}
      />

      <AnimatePresence>
        {totalVideos > 0 ? (
          <motion.div
            style={{ marginTop: 24 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Grid container spacing={{ xs: 2, md: 3 }} data-testid={VIDEO_PAGE_VIEW_TEST_IDS.LIST}>
              {videoData.videos.map((video, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <VideoCard video={video} />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        ) : (
          <motion.div style={{ marginTop: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageViewEmpty
              testId={VIDEO_PAGE_VIEW_TEST_IDS.EMPTY}
              heading={VIDEO_PAGE_VIEW_COPY.EMPTY_TITLE}
              body={VIDEO_PAGE_VIEW_COPY.EMPTY_BODY}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
