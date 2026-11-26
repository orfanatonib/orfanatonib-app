import type React from "react";
import { Menu as MenuIcon } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  ADMIN_FOOTER_HEIGHT_PX,
  ADMIN_HEADER_HEIGHT_PX,
  ADMIN_NAVIGATION_TEST_IDS,
} from "../navigation";
import { AdminSidebar } from "./AdminSidebar";
import {
  ADMIN_DRAWER_Z_INDEX,
  ADMIN_MOBILE_BAR_SPACER_TEST_ID,
  ADMIN_TOUCH_TARGET_PX,
  STUDIO_COLORS,
} from "./constants";
import { useAdminNavigation } from "./useAdminNavigation";
import { getDrawerWidth, isContentStudioPath } from "./utils";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isContentStudioRoute = isContentStudioPath(location.pathname);
  const nav = useAdminNavigation(location.pathname, isMobile);

  const drawerWidth = getDrawerWidth({
    isMobile,
    desktopOpen: nav.desktopOpen,
  });

  const cssVars = {
    "--app-header-h": `${ADMIN_HEADER_HEIGHT_PX}px`,
    "--app-footer-h": `${ADMIN_FOOTER_HEIGHT_PX}px`,
  } as React.CSSProperties;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) nav.closeMobileDrawer();
  };

  const transition = theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  });

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
            zIndex: theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar>
            <IconButton
              aria-label="Abrir menu administrativo"
              color="inherit"
              edge="start"
              onClick={nav.toggleMobileDrawer}
              data-testid={ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_OPEN}
              sx={{
                mr: 2,
                minWidth: ADMIN_TOUCH_TARGET_PX,
                minHeight: ADMIN_TOUCH_TARGET_PX,
              }}
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
        open={isMobile ? nav.mobileOpen : true}
        onClose={nav.closeMobileDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ "data-testid": ADMIN_NAVIGATION_TEST_IDS.SIDEBAR }}
        sx={{
          width: drawerWidth,
          transition,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            transition,
            overflowX: "hidden",
            boxSizing: "border-box",
            mt: `${ADMIN_HEADER_HEIGHT_PX}px`,
            // px, não var(): no celular a gaveta vai para um portal fora do Box que define --app-header-h.
            height: `calc(100vh - ${ADMIN_HEADER_HEIGHT_PX}px)`,
            pb: isMobile ? 0 : "var(--app-footer-h)",
            zIndex: isMobile
              ? ADMIN_DRAWER_Z_INDEX.mobile
              : ADMIN_DRAWER_Z_INDEX.desktop,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <AdminSidebar
          pathname={location.pathname}
          visibleSections={nav.visibleSections}
          availableFilters={nav.availableFilters}
          mobileTab={nav.mobileTab}
          expanded={nav.expanded}
          isMobile={isMobile}
          desktopOpen={nav.desktopOpen}
          onChangeMobileTab={nav.setMobileTab}
          onToggleAccordion={nav.handleAccordion}
          onNavigate={handleNavigate}
          onToggleDesktop={nav.toggleDesktopDrawer}
        />
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
          bgcolor: isContentStudioRoute
            ? STUDIO_COLORS.mainBackground
            : "grey.100",
          minHeight: "calc(100vh - var(--app-header-h))",
        }}
      >
        {/* Espaço da barra "Administração", que é fixa: sem ele ela cobre o topo de toda página no celular. */}
        {isMobile && <Toolbar data-testid={ADMIN_MOBILE_BAR_SPACER_TEST_ID} />}
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
