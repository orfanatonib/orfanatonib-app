import Article from "@mui/icons-material/Article";
import Campaign from "@mui/icons-material/Campaign";
import Description from "@mui/icons-material/Description";
import MenuBook from "@mui/icons-material/MenuBook";
import NoteAdd from "@mui/icons-material/NoteAdd";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

export const ADMIN_CONTENT_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.CONTENT,
  title: "Conteúdo",
  icon: Article,
  items: [
    {
      id: AdminNavigationItemId.CREATE_PAGE,
      label: "Criar Página",
      description: "Crie novas páginas de conteúdo para o site.",
      path: "/adm/criar-pagina",
      icon: NoteAdd,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PAGE_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.MEDITATIONS,
      label: "Meditações",
      description: "Crie e edite meditações semanais.",
      path: "/adm/meditacoes",
      activePathPrefixes: ["/adm/editar-meditacao"],
      icon: MenuBook,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.MEDITATION_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.DOCUMENTS,
      label: "Documentos",
      description: "Disponibilize documentos para download.",
      path: "/adm/documentos",
      icon: Description,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.DOCUMENT_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.INFORMATIVE_BANNERS,
      label: "Informativos",
      description: "Gerencie banners e avisos do site.",
      path: "/adm/informativos",
      icon: Campaign,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.INFORMATIVE_MANAGEMENT,
    },
  ],
};
