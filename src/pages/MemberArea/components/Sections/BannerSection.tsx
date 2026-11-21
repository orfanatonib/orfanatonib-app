import { Box, Typography } from "@mui/material";
import { FeatureGate } from "@/components/common/FeatureGate";
import { FeatureFlagKeys } from "@/features/feature-flags/types";
import { memberAreaColors as colors } from "@/theme/memberArea";
import { BannerSectionProps } from "../../types";
import {
  MemberWeekBanner,
  MemberMeditationBanner,
  IdeasSharingBanner,
} from "../Banners";

const BannerSection = ({
  showWeekBanner,
  showMeditationBanner,
}: BannerSectionProps) => (
  <Box
    data-testid="member-area-banner-section"
    component="section"
    sx={{ mb: { xs: 3, md: 4 } }}
  >
    <Typography
      component="h2"
      variant="overline"
      sx={{
        display: "block",
        mb: 1.5,
        fontWeight: 800,
        color: colors.muted,
        letterSpacing: 1,
      }}
    >
      Preparação da Semana
    </Typography>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: showWeekBanner ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
        },
        gap: { xs: 2, md: 2.5 },
        alignItems: "stretch",
      }}
    >
      {showWeekBanner && <MemberWeekBanner />}
      {showMeditationBanner && <MemberMeditationBanner />}
      <Box sx={{ gridColumn: showMeditationBanner ? "1 / -1" : undefined }}>
        <FeatureGate flag={FeatureFlagKeys.IDEA_SUBMISSION}>
          <IdeasSharingBanner
            variant={showWeekBanner && !showMeditationBanner ? "compact" : "full"}
          />
        </FeatureGate>
      </Box>
    </Box>
  </Box>
);
export default BannerSection;
