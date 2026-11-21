import Collections from "@mui/icons-material/Collections";
import PermMedia from "@mui/icons-material/PermMedia";
import PhotoLibrary from "@mui/icons-material/PhotoLibrary";
import VideoLibrary from "@mui/icons-material/VideoLibrary";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

export const ADMIN_MEDIA_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.MEDIA,
  title: "Mídias",
  icon: PermMedia,
  items: [
    {
      id: AdminNavigationItemId.PHOTO_GALLERIES,
      label: "Galerias de Fotos",
      description: "Organize galerias de imagens do ministério.",
      path: "/adm/paginas-fotos",
      activePathPrefixes: ["/adm/editar-pagina-imagens"],
      icon: PhotoLibrary,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PAGE_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.SHELTER_PHOTOS,
      label: "Fotos dos Abrigos",
      description: "Gerencie fotos específicas de cada abrigo.",
      path: "/adm/fotos-abrigos",
      activePathPrefixes: ["/adm/editar-imagens-shelter"],
      icon: Collections,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PHOTO_MODERATION,
    },
    {
      id: AdminNavigationItemId.VIDEOS,
      label: "Vídeos",
      description: "Adicione vídeos e links do YouTube.",
      path: "/adm/paginas-videos",
      activePathPrefixes: ["/adm/editar-pagina-videos"],
      icon: VideoLibrary,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PAGE_MANAGEMENT,
    },
  ],
};
