import Collections from "@mui/icons-material/Collections";
import Comment from "@mui/icons-material/Comment";
import FactCheck from "@mui/icons-material/FactCheck";
import Forum from "@mui/icons-material/Forum";
import Lightbulb from "@mui/icons-material/Lightbulb";

import { FeatureFlagKeys } from "@/features/feature-flags/types";
import { FEED_COMMENTS_ADMIN_ROUTE } from "@/features/feed-comments/constants";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

/** O que membros, líderes e visitantes enviam e o admin aprova ou publica (com selo de pendentes). */
export const ADMIN_INTERACTION_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.INTERACTION,
  title: "Interação",
  icon: FactCheck,
  items: [
    {
      id: AdminNavigationItemId.SHELTER_PHOTOS,
      label: "Fotos dos abrigos",
      description: "Aprove ou reprove as fotos enviadas pelas equipes.",
      path: "/adm/fotos-abrigos",
      activePathPrefixes: ["/adm/editar-imagens-shelter"],
      icon: Collections,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PHOTO_MODERATION,
    },
    {
      id: AdminNavigationItemId.SHARED_IDEAS,
      label: "Ideias compartilhadas",
      description: "Veja e modere as ideias enviadas pelos abrigos.",
      path: "/adm/ideias-compartilhadas",
      activePathPrefixes: ["/adm/editar-ideias-compartilhadas"],
      icon: Lightbulb,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.IDEA_MODERATION,
    },
    {
      id: AdminNavigationItemId.FEED_COMMENTS,
      label: "Comentários do feed",
      description: "Aprove ou reprove os comentários do feed dos abrigos.",
      path: FEED_COMMENTS_ADMIN_ROUTE,
      icon: Forum,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlags: [
        FeatureFlagKeys.SHELTER_FEED,
        FeatureFlagKeys.SHELTER_FEED_COMMENTS,
      ],
    },
    {
      id: AdminNavigationItemId.COMMENTS,
      label: "Comentários das meditações",
      description: "Modere os comentários dos usuários.",
      path: "/adm/comentarios",
      icon: Comment,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.COMMENT_MODERATION,
    },
  ],
};
