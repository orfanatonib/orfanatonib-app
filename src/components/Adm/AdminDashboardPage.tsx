import React, { useMemo, useState } from "react";
import {
  ArrowUpward,
  ChevronRight,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  Fab,
  Grid,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { FeatureFlagKeys, useIsFeatureEnabled } from "@/features/feature-flags";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";

import {
  ADMIN_FOOTER_HEIGHT_PX,
  ADMIN_NAVIGATION_FILTER_ALL_ID,
  ADMIN_NAVIGATION_FILTERS,
  ADMIN_NAVIGATION_TEST_IDS,
  type AdminNavigationFilterId,
  filterAdminNavigationSections,
  getVisibleAdminNavigationSections,
} from "./navigation";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
  const isLeader = isAuthenticated && user?.role === UserRole.LEADER;
  const isSimpleMode = isLeader && !isAdmin;
  const isShelterManagementEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.SHELTER_MANAGEMENT,
  );
  const isPagelasEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_PAGELAS);

  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<AdminNavigationFilterId>(
    ADMIN_NAVIGATION_FILTER_ALL_ID,
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => setShowScrollTop(window.scrollY > 120);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  const visibleSections = useMemo(
    () =>
      getVisibleAdminNavigationSections({
        isAuthenticated,
        role: user?.role,
        featureFlags: {
          [FeatureFlagKeys.SHELTER_MANAGEMENT]: isShelterManagementEnabled,
          [FeatureFlagKeys.SHELTER_PAGELAS]: isPagelasEnabled,
        },
      }),
    [isAuthenticated, isPagelasEnabled, isShelterManagementEnabled, user?.role],
  );

  const availableFilters = useMemo(
    () =>
      ADMIN_NAVIGATION_FILTERS.filter(
        (filter) =>
          filter.id === ADMIN_NAVIGATION_FILTER_ALL_ID ||
          visibleSections.some((section) => section.id === filter.id),
      ),
    [visibleSections],
  );

  const filteredSections = useMemo(
    () => filterAdminNavigationSections(visibleSections, sectionFilter, query),
    [query, sectionFilter, visibleSections],
  );
  const filteredItems = filteredSections.flatMap((section) => section.items);

  const renderFilters = (compact: boolean) => (
    <>
      <TextField
        fullWidth={compact}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={
          compact ? "Buscar… (ex.: fotos, usuários, vídeos)" : "Buscar…"
        }
        size="small"
        inputProps={{
          "data-testid": ADMIN_NAVIGATION_TEST_IDS.DASHBOARD_SEARCH,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={compact ? { mb: 1 } : { maxWidth: 360, mr: 1 }}
      />

      <Box
        sx={
          compact
            ? {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
                gap: 0.5,
              }
            : { display: "contents" }
        }
      >
        {availableFilters.map((filter) => (
          <Button
            key={filter.id}
            size={compact ? "small" : "medium"}
            variant={sectionFilter === filter.id ? "contained" : "outlined"}
            onClick={() => setSectionFilter(filter.id)}
            data-testid={`${ADMIN_NAVIGATION_TEST_IDS.DASHBOARD_FILTER_PREFIX}-${filter.id}`}
            sx={{
              minHeight: 44,
              textTransform: "none",
              justifyContent: "center",
              px: 1,
              py: 0.5,
              borderRadius: 2,
              fontSize: compact ? 12 : undefined,
              lineHeight: compact ? 1.2 : undefined,
              minWidth: 0,
            }}
          >
            {filter.label}
          </Button>
        ))}
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <Box
        data-testid={ADMIN_NAVIGATION_TEST_IDS.DASHBOARD}
        sx={{ width: "100%", px: 2, pb: 8, mt: 0, pt: 0 }}
      >
        {!isSimpleMode && (
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              bgcolor: "background.paper",
              pt: 0,
              pb: 1.25,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {renderFilters(true)}
          </Box>
        )}

        {filteredSections.map((section) => (
          <Box key={section.id} sx={{ mt: 2 }}>
            {!isSimpleMode &&
              sectionFilter === ADMIN_NAVIGATION_FILTER_ALL_ID && (
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ pl: 0.5, letterSpacing: 0.4 }}
                >
                  {section.title}
                </Typography>
              )}
            <List
              dense
              sx={{
                mt: sectionFilter === ADMIN_NAVIGATION_FILTER_ALL_ID ? 0.5 : 1,
              }}
            >
              {section.items.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <Paper
                    key={item.path}
                    variant="outlined"
                    data-testid={`${ADMIN_NAVIGATION_TEST_IDS.DASHBOARD_CARD_PREFIX}-${item.id}`}
                    sx={{ mb: 1, borderRadius: 2, overflow: "hidden" }}
                  >
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{ minHeight: 44 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <ItemIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={700}>
                            {item.label}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        }
                      />
                      <ChevronRight />
                    </ListItemButton>
                  </Paper>
                );
              })}
            </List>
          </Box>
        ))}

        {filteredItems.length === 0 && (
          <Box
            data-testid={ADMIN_NAVIGATION_TEST_IDS.DASHBOARD_EMPTY}
            sx={{ textAlign: "center", py: 6 }}
          >
            <Typography variant="body2" color="text.secondary">
              {isSimpleMode
                ? "Nada disponível para seu perfil."
                : `Nada encontrado para “${query}”.`}
            </Typography>
          </Box>
        )}

        {showScrollTop && (
          <Fab
            color="primary"
            size="small"
            aria-label="Voltar ao topo"
            data-testid={ADMIN_NAVIGATION_TEST_IDS.DASHBOARD_SCROLL_TOP}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            sx={{
              position: "fixed",
              bottom: ADMIN_FOOTER_HEIGHT_PX,
              right: 16,
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <ArrowUpward />
          </Fab>
        )}
      </Box>
    );
  }

  const greetingName =
    (user?.name && user.name.split(" ")[0]) ||
    (isAdmin ? "Admin" : isLeader ? "Líder(a)" : "Usuário");

  return (
    <Box
      data-testid={ADMIN_NAVIGATION_TEST_IDS.DASHBOARD}
      sx={{ width: "100%", px: { xs: 2, md: 6 }, pt: { xs: 4, md: 0 } }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign={{ xs: "center", md: "left" }}
        mb={3}
        sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, color: "primary.main" }}
      >
        Bem-vindo(a), {greetingName} 👋
      </Typography>

      {!isSimpleMode && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.25,
            alignItems: "center",
            mb: 3,
          }}
        >
          {renderFilters(false)}
        </Box>
      )}

      {!isSimpleMode && <Divider sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {filteredItems.map((item) => {
          const ItemIcon = item.icon;

          return (
            <Grid item key={item.path} xs={12} sm={6} md={4} lg={3}>
              <Paper
                elevation={4}
                data-testid={`${ADMIN_NAVIGATION_TEST_IDS.DASHBOARD_CARD_PREFIX}-${item.id}`}
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  transition: "transform .12s ease, box-shadow .12s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ mb: 1.5 }}>
                    <ItemIcon fontSize="large" color="primary" />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(item.path)}
                  aria-label={`Acessar ${item.label}`}
                  sx={{ minHeight: 44 }}
                >
                  Acessar
                </Button>
              </Paper>
            </Grid>
          );
        })}

        {filteredItems.length === 0 && (
          <Grid item xs={12}>
            <Box
              data-testid={ADMIN_NAVIGATION_TEST_IDS.DASHBOARD_EMPTY}
              sx={{ textAlign: "center", py: 8 }}
            >
              <Typography variant="body2" color="text.secondary">
                Nada disponível para seu perfil.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
