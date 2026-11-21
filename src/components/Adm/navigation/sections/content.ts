import Article from "@mui/icons-material/Article";
import Campaign from "@mui/icons-material/Campaign";
import Description from "@mui/icons-material/Description";
import MenuBook from "@mui/icons-material/MenuBook";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

export const ADMIN_CONTENT_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.CONTENT,
  title: "Conteúdo do site",
  icon: Article,
  items: [
    {
      id: AdminNavigationItemId.MEDITATIONS,
      label: "Meditações",
      description: "Crie e edite meditações semanais.",
      path: "/adm/meditacoes",
      activePathPrefixes: ["/adm/editar-meditacao"],
      icon: MenuBook,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
    {
      id: AdminNavigationItemId.DOCUMENTS,
      label: "Documentos",
      description: "Disponibilize documentos para download.",
      path: "/adm/documentos",
      icon: Description,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
    {
      id: AdminNavigationItemId.INFORMATIVE_BANNERS,
      label: "Informativos",
      description: "Gerencie banners e avisos do site.",
      path: "/adm/informativos",
      icon: Campaign,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
  ],
};
