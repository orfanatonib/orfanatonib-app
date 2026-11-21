import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  List,
  ListItemIcon,
  Tooltip,
  Typography,
} from "@mui/material";

import { ADMIN_NAVIGATION_TEST_IDS } from "../navigation";
import { AdminSidebarItem } from "./AdminSidebarItem";
import type { AdminSidebarSectionProps } from "./types";
import { isMiniDrawer } from "./utils";

export function AdminSidebarSection({
  section,
  pathname,
  expanded,
  isMobile,
  desktopOpen,
  onChange,
  onNavigate,
}: AdminSidebarSectionProps) {
  const SectionIcon = section.icon;
  const mini = isMiniDrawer({ isMobile, desktopOpen });

  return (
    <Accordion
      expanded={expanded}
      onChange={onChange}
      data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_GROUP_PREFIX}-${section.id}`}
      disableGutters
      square
      elevation={0}
      sx={{
        "&::before": { display: "none" },
        overflow: "hidden",
        bgcolor: "transparent",
        border: "none",
      }}
    >
      <AccordionSummary
        expandIcon={mini ? null : <ExpandMore />}
        data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_GROUP_TOGGLE_PREFIX}-${section.id}`}
        sx={{
          minHeight: 48,
          px: mini ? 1 : 2,
          justifyContent: mini ? "center" : "flex-start",
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            my: 0.25,
            flexGrow: mini ? 0 : 1,
            justifyContent: mini ? "center" : "flex-start",
          },
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Tooltip title={mini ? section.title : ""} placement="right" arrow>
          <ListItemIcon
            sx={{ minWidth: mini ? 0 : 36, justifyContent: "center" }}
          >
            <SectionIcon />
          </ListItemIcon>
        </Tooltip>
        {!mini && (
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
          bgcolor: !isMobile ? "action.hover" : "transparent",
          borderLeft: !isMobile ? "3px solid" : "none",
          borderColor: "primary.main",
        }}
      >
        <List dense disablePadding>
          {section.items.map((item) => (
            <AdminSidebarItem
              key={item.path}
              item={item}
              pathname={pathname}
              isMobile={isMobile}
              desktopOpen={desktopOpen}
              onNavigate={onNavigate}
            />
          ))}
        </List>
      </AccordionDetails>
      <Divider />
    </Accordion>
  );
}
