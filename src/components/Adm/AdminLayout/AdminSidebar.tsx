import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";

import { ADMIN_NAVIGATION_TEST_IDS, ADMIN_OVERVIEW_ITEM } from "../navigation";
import { ADMIN_TOUCH_TARGET_PX } from "./constants";
import { AdminSidebarSection } from "./AdminSidebarSection";
import type { AdminSidebarProps } from "./types";
import { isMiniDrawer } from "./utils";

/** Conteúdo do menu lateral: cabeçalho com recolher, visão geral, filtros (celular) e seções. */
export function AdminSidebar({
  pathname,
  visibleSections,
  availableFilters,
  mobileTab,
  expanded,
  isMobile,
  desktopOpen,
  onChangeMobileTab,
  onToggleAccordion,
  onNavigate,
  onToggleDesktop,
}: AdminSidebarProps) {
  const OverviewIcon = ADMIN_OVERVIEW_ITEM.icon;
  const mini = isMiniDrawer({ isMobile, desktopOpen });
  const collapseLabel = desktopOpen
    ? "Recolher menu lateral"
    : "Expandir menu lateral";

  return (
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
              onClick={onToggleDesktop}
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
          selected={pathname === ADMIN_OVERVIEW_ITEM.path}
          onClick={() => onNavigate(ADMIN_OVERVIEW_ITEM.path)}
          data-testid={ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_OVERVIEW}
          sx={{
            minHeight: 48,
            px: mini ? 1 : 2,
            justifyContent: mini ? "center" : "flex-start",
            "&.Mui-selected": {
              bgcolor: "action.selected",
              borderLeft: "3px solid",
              borderColor: "primary.main",
            },
          }}
        >
          <Tooltip
            title={mini ? ADMIN_OVERVIEW_ITEM.label : ""}
            placement="right"
            arrow
          >
            <ListItemIcon
              sx={{ minWidth: mini ? 0 : 36, justifyContent: "center" }}
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
                onClick={() => onChangeMobileTab(filter.id)}
                data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_FILTER_PREFIX}-${filter.id}`}
                sx={{
                  minHeight: ADMIN_TOUCH_TARGET_PX,
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

      {visibleSections.map((section) => (
        <AdminSidebarSection
          key={section.id}
          section={section}
          pathname={pathname}
          expanded={expanded === section.id}
          isMobile={isMobile}
          desktopOpen={desktopOpen}
          onChange={onToggleAccordion(section.id)}
          onNavigate={onNavigate}
        />
      ))}
    </Box>
  );
}
