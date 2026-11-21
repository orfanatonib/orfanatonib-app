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
 * Ícone do item do menu/painel. Os itens que esperam o admin (fotos, ideias, comentários, contatos e feedbacks)
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
    case AdminNavigationItemId.CONTACTS:
      return (
        <PendingCountBadge kind={PendingCountKind.CONTACTS}>{icon}</PendingCountBadge>
      );
    case AdminNavigationItemId.FEEDBACKS:
      return (
        <PendingCountBadge kind={PendingCountKind.FEEDBACKS}>{icon}</PendingCountBadge>
      );
    default:
      return icon;
  }
}
