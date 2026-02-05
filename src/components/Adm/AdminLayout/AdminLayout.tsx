import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  EventNote,
  PhotoLibrary,
  Collections,
  VideoLibrary,
  Lightbulb,
  MenuBook,
  Description,
  Comment,
  Campaign,
  ContactMail,
  RateReview,
  Group,
  School,
  SupervisorAccount,
  Groups,
  NoteAdd,
  ExpandMore,
  CalendarMonth,
  Favorite,
  EventAvailable,
  Handshake,
  People,
  HomeWork,
  Article,
  PermMedia,
  Build,
  Chat,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";
import { useIsFeatureEnabled, FeatureFlagKeys } from "@/features/feature-flags";

const drawerWidth = 240;

type NavItem = { label: string; to: string; icon: ReactNode };
type SectionId = "pessoas" | "abrigos" | "conteudo" | "midias" | "materiais" | "interacoes";
type Section = { id: SectionId; title: string; items: NavItem[]; icon: ReactNode };
type MobileTab = "tudo" | SectionId;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isAdmin = !!isAuthenticated && user?.role === UserRole.ADMIN;
  const isLeader = !!isAuthenticated && user?.role === UserRole.LEADER;

  const isShelterManagementEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_MANAGEMENT);
  const isPagelasEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_PAGELAS);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("tudo");

  // Desktop Drawer State
  const [desktopOpen, setDesktopOpen] = useState(true);

  const toggleDrawer = () => setMobileOpen((v) => !v);
  const toggleDesktop = () => setDesktopOpen((v) => !v);

  const miniDrawerWidth = 72;
  const currentDrawerWidth = isMobile ? drawerWidth : (desktopOpen ? drawerWidth : miniDrawerWidth);

  const HEADER_H = 64;
  const FOOTER_H = 88;
  const cssVars = {
    "--app-header-h": `${HEADER_H}px`,
    "--app-footer-h": `${FOOTER_H}px`,
  } as React.CSSProperties;

  const allSections = useMemo<Section[]>(
    () => [
      {
        id: "pessoas",
        title: "Pessoas",
        icon: <People />,
        items: [
          { label: "Usuários", to: "/adm/usuarios", icon: <Group /> },
          { label: "Perfis", to: "/adm/perfis", icon: <Favorite /> },
          { label: "Membros", to: "/adm/membros", icon: <School /> },
          { label: "Líderes", to: "/adm/lideres", icon: <SupervisorAccount /> },
          { label: "Acolhidos", to: "/adm/acolhidos", icon: <Group /> },
        ],
      },
      {
        id: "abrigos",
        title: "Abrigos",
        icon: <HomeWork />,
        items: [
          { label: "Abrigos", to: "/adm/abrigos", icon: <Groups /> },
          { label: "Pagelas", to: "/adm/pagelas", icon: <Description /> },
          { label: "Agendamentos", to: "/adm/agendamentos", icon: <CalendarMonth /> },
          { label: "Relatórios das Visitas", to: "/adm/relatorios-visita", icon: <Description /> },
          { label: "Integrações FM", to: "/adm/integracoes", icon: <Handshake /> },
          { label: "Presenças", to: "/adm/presenca", icon: <EventAvailable /> },
        ],
      },
      {
        id: "conteudo",
        title: "Conteúdo",
        icon: <Article />,
        items: [
          { label: "Criar Página", to: "/adm/criar-pagina", icon: <NoteAdd /> },
          { label: "Meditações", to: "/adm/meditacoes", icon: <MenuBook /> },
          { label: "Documentos", to: "/adm/documentos", icon: <Description /> },
          { label: "Informativos", to: "/adm/informativos", icon: <Campaign /> },
        ],
      },
      {
        id: "midias",
        title: "Mídias",
        icon: <PermMedia />,
        items: [
          { label: "Galerias de Fotos", to: "/adm/paginas-fotos", icon: <PhotoLibrary /> },
          { label: "Fotos dos Abrigos", to: "/adm/fotos-abrigos", icon: <Collections /> },
          { label: "Vídeos", to: "/adm/paginas-videos", icon: <VideoLibrary /> },
        ],
      },
      {
        id: "materiais",
        title: "Materiais",
        icon: <Build />,
        items: [
          { label: "Materiais de Visita", to: "/adm/paginas-materiais-visita", icon: <EventNote /> },
          { label: "Páginas de Ideias", to: "/adm/paginas-ideias", icon: <Lightbulb /> },
          { label: "Ideias Compartilhadas", to: "/adm/ideias-compartilhadas", icon: <Lightbulb /> },
        ],
      },
      {
        id: "interacoes",
        title: "Interações",
        icon: <Chat />,
        items: [
          { label: "Comentários", to: "/adm/comentarios", icon: <Comment /> },
          { label: "Contatos", to: "/adm/contatos", icon: <ContactMail /> },
          { label: "Feedbacks", to: "/adm/feedbacks", icon: <RateReview /> },
        ],
      },
    ],
    []
  );

  const leaderAllowed = new Set<string>([
    "/adm/acolhidos",
    "/adm/membros",
    "/adm/perfis",
    "/adm/abrigos",
    "/adm/pagelas",
    "/adm/agendamentos",
    "/adm/presenca",
    "/adm/integracoes",
    "/adm/relatorios-visita",
  ]);

  const canSeeItem = (item: NavItem): boolean => {
    if (item.to === '/adm/acolhidos' && !isShelterManagementEnabled) return false;
    if (item.to === '/adm/pagelas' && !isPagelasEnabled) return false;

    if (isAdmin) return true;
    if (isLeader) return leaderAllowed.has(item.to);
    return false;
  };

  const sections = useMemo<Section[]>(() => {
    const filtered = allSections
      .map((sec) => ({ ...sec, items: sec.items.filter(canSeeItem) }))
      .filter((sec) => sec.items.length > 0);
    return filtered;
  }, [allSections, isAdmin, isLeader]);

  const sectionOfPath = (path: string): SectionId => {

    if (
      path.startsWith("/adm/usuarios") ||
      path.startsWith("/adm/perfis") ||
      path.startsWith("/adm/membros") ||
      path.startsWith("/adm/lideres") ||
      path.startsWith("/adm/acolhidos")
    ) {
      return "pessoas";
    }

    if (
      path.startsWith("/adm/abrigos") ||
      path.startsWith("/adm/pagelas") ||
      path.startsWith("/adm/agendamentos") ||
      path.startsWith("/adm/relatorios-visita") ||
      path.startsWith("/adm/presenca") ||
      path.startsWith("/adm/integracoes")
    ) {
      return "abrigos";
    }

    if (
      path.startsWith("/adm/criar-pagina") ||
      path.startsWith("/adm/meditacoes") ||
      path.startsWith("/adm/documentos") ||
      path.startsWith("/adm/informativos")
    ) {
      return "conteudo";
    }

    if (
      path.startsWith("/adm/paginas-fotos") ||
      path.startsWith("/adm/fotos-abrigos") ||
      path.startsWith("/adm/paginas-videos")
    ) {
      return "midias";
    }

    if (
      path.startsWith("/adm/paginas-materiais-visita") ||
      path.startsWith("/adm/paginas-ideias") ||
      path.startsWith("/adm/ideias-compartilhadas")
    ) {
      return "materiais";
    }

    return "interacoes";
  };

  const [expanded, setExpanded] = useState<SectionId | null>(sectionOfPath(location.pathname));

  useEffect(() => {
    const target = sectionOfPath(location.pathname);
    setExpanded((prev) => (prev === target ? prev : target));
  }, [location.pathname]);

  const handleAccordion =
    (panel: SectionId) => (_: React.SyntheticEvent, isExpanding: boolean) =>
      setExpanded((prev) => (isExpanding ? panel : prev === panel ? null : prev));

  const handleNavigate = (to: string) => {
    navigate(to);
    if (isMobile) setMobileOpen(false);
  };

  const visibleSections =
    isMobile && mobileTab !== "tudo" ? sections.filter((s) => s.id === mobileTab) : sections;

  const labelMap: Record<MobileTab, string> = {
    tudo: "Tudo",
    pessoas: "Pessoas",
    abrigos: "Abrigos",
    conteudo: "Conteúdo",
    midias: "Mídias",
    materiais: "Materiais",
    interacoes: "Interações",
  };

  const drawerContent = (
    <>

      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: desktopOpen ? 'space-between' : 'center',
        pl: desktopOpen ? 2 : 0,
        pr: 1,
        pb: 1,
        pt: 1
      }}>
        {desktopOpen && (
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            Painel Admin
          </Typography>
        )}

        {!isMobile && (
          <IconButton
            onClick={toggleDesktop}
            size="small"
            sx={{
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' },
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {desktopOpen ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        )}
      </Box>
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
            {(["tudo", "pessoas", "abrigos", "conteudo", "midias", "materiais", "interacoes"] as MobileTab[]).map((tab) => (
              <Button
                key={tab}
                size="small"
                variant={mobileTab === tab ? "contained" : "outlined"}
                onClick={() => setMobileTab(tab)}
                sx={{
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
                {labelMap[tab]}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {visibleSections.map((sec) => (
        <Accordion
          key={sec.id}
          expanded={expanded === sec.id}
          onChange={handleAccordion(sec.id)}
          disableGutters
          square
          elevation={0}
          sx={{
            "&::before": { display: "none" },
            borderRadius: 0,
            bgcolor: "transparent",
          }}
        >
          <AccordionSummary
            expandIcon={(!isMobile && !desktopOpen) ? null : <ExpandMore />}
            sx={{
              px: (!isMobile && !desktopOpen) ? 1 : 2,
              py: 1,
              justifyContent: (!isMobile && !desktopOpen) ? 'center' : 'flex-start',
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                my: 0.25,
                flexGrow: (!isMobile && !desktopOpen) ? 0 : 1,
                justifyContent: (!isMobile && !desktopOpen) ? 'center' : 'flex-start'
              },
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            {(!isMobile && !desktopOpen) ? (
              <Tooltip title={sec.title} placement="right" arrow>
                <Box display="flex" alignItems="center" justifyContent="center">
                  {sec.icon}
                </Box>
              </Tooltip>
            ) : (
              <Typography
                variant="caption"
                fontWeight="bold"
                color="text.secondary"
                sx={{ fontSize: isMobile ? 11 : undefined }}
              >
                {sec.title}
              </Typography>
            )}

          </AccordionSummary>

          <AccordionDetails sx={{
            p: 0,
            display: (!isMobile && !desktopOpen && expanded !== sec.id) ? 'none' : 'block',
            bgcolor: !isMobile ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
            borderLeft: !isMobile ? '3px solid' : 'none',
            borderColor: 'primary.main'
          }}>
            <List dense disablePadding>
              {sec.items.map((item) => {
                const selected =
                  location.pathname === item.to ||
                  location.pathname.startsWith(item.to + "/");

                const buttonContent = (
                  <ListItemButton
                    key={item.to}
                    selected={selected}
                    onClick={() => handleNavigate(item.to)}
                    sx={{
                      py: 1,
                      px: (!isMobile && !desktopOpen) ? 1 : 2,
                      justifyContent: (!isMobile && !desktopOpen) ? 'center' : 'flex-start',
                      "& .MuiListItemText-primary": { fontSize: isMobile ? 13 : undefined },
                      "& .MuiListItemIcon-root, & .MuiSvgIcon-root": {
                        fontSize: isMobile ? "1.1rem" : undefined,
                      },
                      "&.Mui-selected": {
                        bgcolor: "action.selected",
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        "&:hover": { bgcolor: "action.selected" },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: (!isMobile && !desktopOpen) ? 0 : 36, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                    {(isMobile || desktopOpen) && <ListItemText primary={item.label} />}
                  </ListItemButton>
                );

                if (!isMobile && !desktopOpen) {
                  return (
                    <Tooltip key={item.to} title={item.label} placement="right" arrow>
                      {buttonContent}
                    </Tooltip>
                  )
                }

                return buttonContent;
              })}
            </List>
          </AccordionDetails>
          <Divider />
        </Accordion>
      ))}
    </>
  );

  return (
    <Box
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
        <AppBar position="fixed" color="inherit" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
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
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: currentDrawerWidth,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: currentDrawerWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            boxSizing: "border-box",
            mt: isMobile ? 0 : `${HEADER_H}px`,
            height: isMobile
              ? "100vh"
              : `calc(100vh - var(--app-header-h))`,
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
        sx={{
          flexGrow: 1,
          width: "100%",
          px: { xs: 0, md: 4 },
          pt: { xs: 2, md: 6 },
          pb: { xs: "var(--app-footer-h)", md: "var(--app-footer-h)" },
          mt: 0,
          bgcolor: "#f5f7fa",
          minHeight: `calc(100vh - var(--app-header-h))`,
        }}
      >
        {isMobile && <Toolbar sx={{ minHeight: 0, p: 0 }} />}
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
