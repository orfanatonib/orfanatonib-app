import React, { useEffect, useMemo, useState } from "react";
import {
  Menu as MenuIcon,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { FeatureFlagKeys, useIsFeatureEnabled } from "@/features/feature-flags";
import { RootState } from "@/store/slices";

import {
  ADMIN_DRAWER_WIDTH_PX,
  ADMIN_FOOTER_HEIGHT_PX,
  ADMIN_HEADER_HEIGHT_PX,
  ADMIN_MINI_DRAWER_WIDTH_PX,
  ADMIN_NAVIGATION_FILTER_ALL_ID,
  ADMIN_NAVIGATION_FILTERS,
  ADMIN_NAVIGATION_TEST_IDS,
  ADMIN_OVERVIEW_ITEM,
  type AdminNavigationFilterId,
  AdminNavigationSectionId,
  getAdminNavigationSectionForPath,
  getVisibleAdminNavigationSections,
  isAdminNavigationItemActive,
} from "../navigation";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isContentStudioRoute = location.pathname.startsWith("/adm/estudio");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const isShelterManagementEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.SHELTERED_MANAGEMENT,
  );
  const isPagelasEnabled = useIsFeatureEnabled(FeatureFlagKeys.PAGELAS);
  const isContentStudioEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO,
  );
  const isContentStudioReviewEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO_REVIEW,
  );
  const isContentStudioProviderAdminEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO_PROVIDER_ADMIN,
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<AdminNavigationFilterId>(
    ADMIN_NAVIGATION_FILTER_ALL_ID,
  );
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [expanded, setExpanded] = useState<AdminNavigationSectionId | null>(
    () => getAdminNavigationSectionForPath(location.pathname),
  );

  const sections = useMemo(
    () =>
      getVisibleAdminNavigationSections({
        isAuthenticated,
        role: user?.role,
        featureFlags: {
          [FeatureFlagKeys.SHELTERED_MANAGEMENT]: isShelterManagementEnabled,
          [FeatureFlagKeys.PAGELAS]: isPagelasEnabled,
          [FeatureFlagKeys.CONTENT_STUDIO]: isContentStudioEnabled,
          [FeatureFlagKeys.CONTENT_STUDIO_REVIEW]: isContentStudioReviewEnabled,
          [FeatureFlagKeys.CONTENT_STUDIO_PROVIDER_ADMIN]:
            isContentStudioProviderAdminEnabled,
        },
      }),
    [
      isAuthenticated,
      isContentStudioEnabled,
      isContentStudioProviderAdminEnabled,
      isContentStudioReviewEnabled,
      isPagelasEnabled,
      isShelterManagementEnabled,
      user?.role,
    ],
  );

  const availableFilters = useMemo(
    () =>
      ADMIN_NAVIGATION_FILTERS.filter(
        (filter) =>
          filter.id === ADMIN_NAVIGATION_FILTER_ALL_ID ||
          sections.some((section) => section.id === filter.id),
      ),
    [sections],
  );

  useEffect(() => {
    const target = getAdminNavigationSectionForPath(location.pathname);
    setExpanded((previous) => (previous === target ? previous : target));
  }, [location.pathname]);

  useEffect(() => {
    if (
      mobileTab !== ADMIN_NAVIGATION_FILTER_ALL_ID &&
      !sections.some((section) => section.id === mobileTab)
    ) {
      setMobileTab(ADMIN_NAVIGATION_FILTER_ALL_ID);
    }
  }, [mobileTab, sections]);

  const currentDrawerWidth = isMobile
    ? ADMIN_DRAWER_WIDTH_PX
    : desktopOpen
      ? ADMIN_DRAWER_WIDTH_PX
      : ADMIN_MINI_DRAWER_WIDTH_PX;

  const cssVars = {
    "--app-header-h": `${ADMIN_HEADER_HEIGHT_PX}px`,
    "--app-footer-h": `${ADMIN_FOOTER_HEIGHT_PX}px`,
  } as React.CSSProperties;

  const visibleSections =
    isMobile && mobileTab !== ADMIN_NAVIGATION_FILTER_ALL_ID
      ? sections.filter((section) => section.id === mobileTab)
      : sections;

  const toggleMobileDrawer = () => setMobileOpen((isOpen) => !isOpen);
  const closeMobileDrawer = () => setMobileOpen(false);
  const toggleDesktopDrawer = () => setDesktopOpen((isOpen) => !isOpen);

  const handleAccordion =
    (panel: AdminNavigationSectionId) =>
    (_event: React.SyntheticEvent, isExpanding: boolean) =>
      setExpanded((previous) =>
        isExpanding ? panel : previous === panel ? null : previous,
      );

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) closeMobileDrawer();
  };

  const OverviewIcon = ADMIN_OVERVIEW_ITEM.icon;
  const collapseLabel = desktopOpen
    ? "Recolher menu lateral"
    : "Expandir menu lateral";

  const drawerContent = (
    <Box
      component="nav"
      aria-label="Navegação do painel administrativo"
      data-testid={ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_NAVIGATION}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: desktopOpen ? "space-between" : "center",
          pl: desktopOpen ? 2 : 0,
          pr: 1,
          pb: 1,
          pt: 1,
        }}
      >
        {desktopOpen && (
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            Painel Admin
          </Typography>
        )}

        {!isMobile && (
          <Tooltip title={collapseLabel} placement="right" arrow>
            <IconButton
              aria-label={collapseLabel}
              data-testid={ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_COLLAPSE}
              onClick={toggleDesktopDrawer}
              size="small"
              sx={{
                bgcolor: "action.hover",
                "&:hover": { bgcolor: "action.selected" },
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {desktopOpen ? (
                <ChevronLeft fontSize="small" />
              ) : (
                <ChevronRight fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider />

      <List disablePadding>
        <ListItemButton
          selected={location.pathname === ADMIN_OVERVIEW_ITEM.path}
          onClick={() => handleNavigate(ADMIN_OVERVIEW_ITEM.path)}
          data-testid={ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_OVERVIEW}
          sx={{
            minHeight: 48,
            px: !isMobile && !desktopOpen ? 1 : 2,
            justifyContent: !isMobile && !desktopOpen ? "center" : "flex-start",
            "&.Mui-selected": {
              bgcolor: "action.selected",
              borderLeft: "3px solid",
              borderColor: "primary.main",
            },
          }}
        >
          <Tooltip
            title={!isMobile && !desktopOpen ? ADMIN_OVERVIEW_ITEM.label : ""}
            placement="right"
            arrow
          >
            <ListItemIcon
              sx={{
                minWidth: !isMobile && !desktopOpen ? 0 : 36,
                justifyContent: "center",
              }}
            >
              <OverviewIcon />
            </ListItemIcon>
          </Tooltip>
          {(isMobile || desktopOpen) && (
            <ListItemText primary={ADMIN_OVERVIEW_ITEM.label} />
          )}
        </ListItemButton>
      </List>
      <Divider />

      {isMobile && (
        <Box sx={{ px: 1.25, py: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
              gap: 0.5,
            }}
          >
            {availableFilters.map((filter) => (
              <Button
                key={filter.id}
                size="small"
                variant={mobileTab === filter.id ? "contained" : "outlined"}
                onClick={() => setMobileTab(filter.id)}
                data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_FILTER_PREFIX}-${filter.id}`}
                sx={{
                  minHeight: 44,
                  textTransform: "none",
                  justifyContent: "center",
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: 12,
                  lineHeight: 1.2,
                  minWidth: 0,
                }}
              >
                {filter.label}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {visibleSections.map((section) => {
        const SectionIcon = section.icon;
        const isStudioSection =
          section.id === AdminNavigationSectionId.CONTENT_STUDIO;

        return (
          <Accordion
            key={section.id}
            expanded={expanded === section.id}
            onChange={handleAccordion(section.id)}
            data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_GROUP_PREFIX}-${section.id}`}
            disableGutters
            square
            elevation={0}
            sx={{
              "&::before": { display: "none" },
              borderRadius: isStudioSection ? 2 : 0,
              mx: isStudioSection ? 1 : 0,
              mb: isStudioSection ? 1 : 0,
              overflow: "hidden",
              bgcolor: isStudioSection
                ? "rgba(48, 94, 143, 0.07)"
                : "transparent",
              border: isStudioSection
                ? "1px solid rgba(48, 94, 143, 0.13)"
                : "none",
            }}
          >
            <AccordionSummary
              expandIcon={!isMobile && !desktopOpen ? null : <ExpandMore />}
              data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_GROUP_TOGGLE_PREFIX}-${section.id}`}
              sx={{
                minHeight: 48,
                px: !isMobile && !desktopOpen ? 1 : 2,
                justifyContent:
                  !isMobile && !desktopOpen ? "center" : "flex-start",
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                  my: 0.25,
                  flexGrow: !isMobile && !desktopOpen ? 0 : 1,
                  justifyContent:
                    !isMobile && !desktopOpen ? "center" : "flex-start",
                },
                color: isStudioSection ? "#244d79" : "inherit",
                "&:hover": {
                  bgcolor: isStudioSection
                    ? "rgba(48, 94, 143, 0.11)"
                    : "action.hover",
                },
              }}
            >
              <Tooltip
                title={!isMobile && !desktopOpen ? section.title : ""}
                placement="right"
                arrow
              >
                <ListItemIcon
                  sx={{
                    minWidth: !isMobile && !desktopOpen ? 0 : 36,
                    justifyContent: "center",
                  }}
                >
                  <SectionIcon />
                </ListItemIcon>
              </Tooltip>
              {(isMobile || desktopOpen) && (
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? 11 : undefined }}
                >
                  {section.title}
                </Typography>
              )}
            </AccordionSummary>

            <AccordionDetails
              sx={{
                p: 0,
                bgcolor: isStudioSection
                  ? "rgba(48, 94, 143, 0.035)"
                  : !isMobile
                    ? "action.hover"
                    : "transparent",
                borderLeft: !isMobile ? "3px solid" : "none",
                borderColor: isStudioSection ? "#477aa8" : "primary.main",
              }}
            >
              <List dense disablePadding>
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const buttonContent = (
                    <ListItemButton
                      key={item.path}
                      selected={isAdminNavigationItemActive(
                        item,
                        location.pathname,
                      )}
                      onClick={() => handleNavigate(item.path)}
                      data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_ITEM_PREFIX}-${item.id}`}
                      sx={{
                        minHeight: 44,
                        py: 1,
                        px: !isMobile && !desktopOpen ? 1 : 2,
                        justifyContent:
                          !isMobile && !desktopOpen ? "center" : "flex-start",
                        "& .MuiListItemText-primary": {
                          fontSize: isMobile ? 13 : undefined,
                        },
                        "& .MuiListItemIcon-root, & .MuiSvgIcon-root": {
                          fontSize: isMobile ? "1.1rem" : undefined,
                        },
                        "&.Mui-selected": {
                          bgcolor: isStudioSection
                            ? "rgba(48, 94, 143, 0.12)"
                            : "action.selected",
                          border: "1px solid",
                          borderColor: isStudioSection
                            ? "rgba(48, 94, 143, 0.3)"
                            : "primary.main",
                          borderRadius: 1,
                          "&:hover": {
                            bgcolor: isStudioSection
                              ? "rgba(48, 94, 143, 0.16)"
                              : "action.selected",
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: !isMobile && !desktopOpen ? 0 : 36,
                          justifyContent: "center",
                        }}
                      >
                        <ItemIcon />
                      </ListItemIcon>
                      {(isMobile || desktopOpen) && (
                        <ListItemText primary={item.label} />
                      )}
                    </ListItemButton>
                  );

                  return !isMobile && !desktopOpen ? (
                    <Tooltip
                      key={item.path}
                      title={item.label}
                      placement="right"
                      arrow
                    >
                      {buttonContent}
                    </Tooltip>
                  ) : (
                    buttonContent
                  );
                })}
              </List>
            </AccordionDetails>
            <Divider />
          </Accordion>
        );
      })}
    </Box>
  );

  return (
    <Box
      data-testid={ADMIN_NAVIGATION_TEST_IDS.LAYOUT}
      style={cssVars}
      sx={{
        display: "flex",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        minHeight: "100vh",
        m: 0,
        p: 0,
      }}
    >
      {isMobile && (
        <AppBar
          position="fixed"
          color="inherit"
          sx={{
            top: `${ADMIN_HEADER_HEIGHT_PX}px`,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              aria-label="Abrir menu administrativo"
              color="inherit"
              edge="start"
              onClick={toggleMobileDrawer}
              data-testid={ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_OPEN}
              sx={{ mr: 2, minWidth: 44, minHeight: 44 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ fontSize: 18 }}>
              Administração
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={closeMobileDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ "data-testid": ADMIN_NAVIGATION_TEST_IDS.SIDEBAR }}
        sx={{
          width: currentDrawerWidth,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: currentDrawerWidth,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: "hidden",
            boxSizing: "border-box",
            mt: isMobile ? 0 : `${ADMIN_HEADER_HEIGHT_PX}px`,
            height: isMobile ? "100vh" : "calc(100vh - var(--app-header-h))",
            pb: isMobile ? 0 : "var(--app-footer-h)",
            zIndex: isMobile ? 1300 : 1000,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        data-testid={ADMIN_NAVIGATION_TEST_IDS.MAIN}
        sx={{
          flexGrow: 1,
          width: "100%",
          px: isContentStudioRoute ? 0 : { xs: 0, md: 4 },
          pt: isContentStudioRoute ? { xs: 1, md: 2 } : { xs: 2, md: 6 },
          pb: "var(--app-footer-h)",
          mt: 0,
          bgcolor: isContentStudioRoute ? "#f6f8fb" : "grey.100",
          minHeight: "calc(100vh - var(--app-header-h))",
        }}
      >
        {/* Espaço da barra "Administração", que é fixa: sem ele ela cobre o topo de toda página no celular. */}
        {isMobile && <Toolbar data-testid="admin-mobile-bar-spacer" />}
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
