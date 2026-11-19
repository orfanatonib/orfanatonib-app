import { Box, Button, Paper, Typography } from "@mui/material";
import { AutoStoriesOutlined, ArrowForward } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { MediaTargetType } from "@/store/slices/types";
import { memberAreaColors as colors } from "@/theme/memberArea";
import { useVisibleRoutes } from "@/features/feature-flags";
import { MEMBER_SUBPAGE_PATHS } from "../../constants/navigation";
import { buildMemberContentPath } from "../../utils/navigation";

const MemberWeekBanner = () => {
  const routes = useVisibleRoutes();
  const { loading, error } = useSelector((state: RootState) => state.routes);
  const current = routes.find(
    (route) =>
      route.entityType === MediaTargetType.VisitMaterialsPage && route.current,
  );
  const to = current
    ? (buildMemberContentPath(current.entityType, current.idToFetch) ??
      MEMBER_SUBPAGE_PATHS.materials)
    : MEMBER_SUBPAGE_PATHS.materials;
  return (
    <Paper
      data-testid="member-area-week-banner"
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: `1px solid ${colors.border}`,
        background: colors.header,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        height: "100%",
      }}
    >
      <AutoStoriesOutlined sx={{ color: colors.blue, fontSize: 32 }} />
      <Typography
        variant="overline"
        sx={{ color: colors.blue, fontWeight: 800 }}
      >
        Materiais de visita
      </Typography>
      <Typography
        component="h3"
        variant="h5"
        sx={{ fontWeight: 800, color: colors.ink }}
      >
        {current?.title || "Prepare sua próxima visita"}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.text, flex: 1 }}>
        {loading
          ? "Carregando os materiais da visita..."
          : error
            ? "Consulte o acervo para encontrar os materiais da visita."
            : current?.subtitle ||
              "Encontre lições, histórias bíblicas e atividades para compartilhar com os acolhidos."}
      </Typography>
      <Box>
        <Button
          data-testid="member-area-week-banner-open"
          component={Link}
          to={to}
          endIcon={<ArrowForward />}
          sx={{
            minHeight: 44,
            bgcolor: colors.blue,
            color: colors.surface,
            px: 2,
            "&:hover": { bgcolor: colors.ink },
          }}
        >
          {current ? "Acessar material atual" : "Explorar materiais"}
        </Button>
      </Box>
    </Paper>
  );
};
export default MemberWeekBanner;
