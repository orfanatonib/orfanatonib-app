import Build from "@mui/icons-material/Build";
import EventNote from "@mui/icons-material/EventNote";
import Lightbulb from "@mui/icons-material/Lightbulb";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

export const ADMIN_MATERIALS_AND_IDEAS_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.MATERIALS_AND_IDEAS,
  title: "Materiais e ideias",
  icon: Build,
  items: [
    {
      id: AdminNavigationItemId.VISIT_MATERIALS,
      label: "Materiais de Visita",
      description: "Gerencie materiais para as visitas.",
      path: "/adm/paginas-materiais-visita",
      activePathPrefixes: ["/adm/editar-pagina-visita"],
      icon: EventNote,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PAGE_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.IDEAS_PAGES,
      label: "Páginas de Ideias",
      description: "Organize páginas com sugestões de atividades.",
      path: "/adm/paginas-ideias",
      activePathPrefixes: ["/adm/editar-pagina-ideias"],
      icon: Lightbulb,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PAGE_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.SHARED_IDEAS,
      label: "Ideias Compartilhadas",
      description: "Veja ideias enviadas pelos abrigos.",
      path: "/adm/ideias-compartilhadas",
      activePathPrefixes: ["/adm/editar-ideias-compartilhadas"],
      icon: Lightbulb,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.IDEA_MODERATION,
    },
  ],
};
