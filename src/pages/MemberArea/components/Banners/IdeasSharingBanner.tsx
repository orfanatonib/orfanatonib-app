import { Box, Button, Paper, Typography } from "@mui/material";
import { LightbulbOutlined, ArrowForward } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { memberAreaColors as colors } from "@/theme/memberArea";
import { MEMBER_SUBPAGE_PATHS } from "../../constants/navigation";
import type { IdeasSharingBannerProps } from "../../types";

const IdeasSharingBanner = ({
  variant = "full",
  forceColumnLayout = false,
}: IdeasSharingBannerProps) => (
  <Paper
    data-testid="member-area-ideas-banner"
    elevation={0}
    sx={{
      p: { xs: 2.5, md: 3 },
      borderRadius: 3,
      bgcolor: colors.purpleSoft,
      border: `1px solid ${colors.border}`,
      display: "flex",
      flexDirection: {
        xs: "column",
        md: variant === "compact" || forceColumnLayout ? "column" : "row",
      },
      alignItems: { xs: "stretch", md: "center" },
      gap: 2,
      height: "100%",
    }}
  >
    <Box sx={{ flex: 1, width: "100%" }}>
      <LightbulbOutlined sx={{ color: colors.purple, fontSize: 32, mb: 1 }} />
      <Typography
        variant="overline"
        sx={{ display: "block", color: colors.purple, fontWeight: 800 }}
      >
        Ideias que inspiram
      </Typography>
      <Typography
        component="h3"
        variant="h5"
        sx={{ color: colors.ink, fontWeight: 800, my: 1 }}
      >
        Sua ideia pode transformar uma visita
      </Typography>
      <Typography variant="body2" sx={{ color: colors.text }}>
        Compartilhe dinâmicas, brincadeiras e atividades. Juntos, podemos levar
        o amor de Jesus a mais vidas.
      </Typography>
    </Box>
    <Box
      sx={{
        alignSelf: {
          xs: "flex-start",
          md: variant === "compact" ? "flex-start" : "center",
        },
        flexShrink: 0,
      }}
    >
      <Button
        data-testid="member-area-ideas-banner-share"
        component={Link}
        to={MEMBER_SUBPAGE_PATHS.shareIdea}
        endIcon={<ArrowForward />}
        sx={{
          minHeight: 44,
          px: 2,
          bgcolor: colors.purple,
          color: colors.surface,
          "&:hover": { bgcolor: colors.ink },
        }}
      >
        Compartilhar ideia
      </Button>
    </Box>
  </Paper>
);
export default IdeasSharingBanner;
