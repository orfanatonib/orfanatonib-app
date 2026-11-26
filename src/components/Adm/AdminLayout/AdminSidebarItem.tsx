import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";


import {
  ADMIN_NAVIGATION_TEST_IDS,
  isAdminNavigationItemActive,
} from "../navigation";
import { AdminNavigationItemIcon } from "../AdminNavigationItemIcon";
import { ADMIN_TOUCH_TARGET_PX } from "./constants";
import type { AdminSidebarItemProps } from "./types";
import { isMiniDrawer } from "./utils";

export function AdminSidebarItem({
  item,
  pathname,
  isMobile,
  desktopOpen,
  onNavigate,
}: AdminSidebarItemProps) {
  const mini = isMiniDrawer({ isMobile, desktopOpen });

  const buttonContent = (
    <ListItemButton
      key={item.path}
      selected={isAdminNavigationItemActive(item, pathname)}
      onClick={() => onNavigate(item.path)}
      data-testid={`${ADMIN_NAVIGATION_TEST_IDS.SIDEBAR_ITEM_PREFIX}-${item.id}`}
      sx={{
        minHeight: ADMIN_TOUCH_TARGET_PX,
        py: 1,
        px: mini ? 1 : 2,
        justifyContent: mini ? "center" : "flex-start",
        "& .MuiListItemText-primary": { fontSize: isMobile ? 13 : undefined },
        "& .MuiListItemIcon-root, & .MuiSvgIcon-root": {
          fontSize: isMobile ? "1.1rem" : undefined,
        },
        "&.Mui-selected": {
          bgcolor: "action.selected",
          border: "1px solid",
          borderColor: "primary.main",
          borderRadius: 1,
          "&:hover": { bgcolor: "action.selected" },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: mini ? 0 : 36, justifyContent: "center" }}>
        <AdminNavigationItemIcon item={item} />
      </ListItemIcon>
      {!mini && <ListItemText primary={item.label} />}
    </ListItemButton>
  );

  return mini ? (
    <Tooltip title={item.label} placement="right" arrow>
      {buttonContent}
    </Tooltip>
  ) : (
    buttonContent
  );
}
