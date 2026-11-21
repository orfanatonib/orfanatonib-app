import type { SvgIconProps } from "@mui/material";

import {
  PendingCountBadge,
  PendingCountKind,
} from "@/features/admin-pending-counts";
import { FeedCommentsPendingBadge } from "@/features/feed-comments";
import { ImageSectionsPendingBadge } from "@/features/image-sections";

import { AdminNavigationItemId, type AdminNavigationItem } from "./navigation";

export interface AdminNavigationItemIconProps {
  readonly item: AdminNavigationItem;
  readonly iconProps?: SvgIconProps;
}

/**
 * Ícone do item do menu/painel. Os itens das filas de interação (fotos, ideias, comentários)
 * mostram o selo com o total aguardando o admin; os demais, só o ícone.
 */
export function AdminNavigationItemIcon({
  item,
  iconProps,
}: AdminNavigationItemIconProps) {
  const ItemIcon = item.icon;
  const icon = <ItemIcon {...iconProps} />;

  switch (item.id) {
    case AdminNavigationItemId.SHELTER_PHOTOS:
      return <ImageSectionsPendingBadge>{icon}</ImageSectionsPendingBadge>;
    case AdminNavigationItemId.FEED_COMMENTS:
      return <FeedCommentsPendingBadge>{icon}</FeedCommentsPendingBadge>;
    case AdminNavigationItemId.SHARED_IDEAS:
      return (
        <PendingCountBadge kind={PendingCountKind.SHARED_IDEAS}>
          {icon}
        </PendingCountBadge>
      );
    case AdminNavigationItemId.COMMENTS:
      return (
        <PendingCountBadge kind={PendingCountKind.COMMENTS}>
          {icon}
        </PendingCountBadge>
      );
    default:
      return icon;
  }
}
