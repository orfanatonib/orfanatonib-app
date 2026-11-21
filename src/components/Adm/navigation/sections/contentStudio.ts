import Article from "@mui/icons-material/Article";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Dashboard from "@mui/icons-material/Dashboard";
import EditNote from "@mui/icons-material/EditNote";
import RateReview from "@mui/icons-material/RateReview";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

export const ADMIN_CONTENT_STUDIO_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.CONTENT_STUDIO,
  title: "Estúdio Orfanato",
  icon: AutoAwesome,
  items: [
    {
      id: AdminNavigationItemId.CONTENT_STUDIO,
      label: "Visão geral",
      description: "Acompanhe indicadores e os materiais para visita recentes.",
      path: "/adm/estudio",
      exact: true,
      icon: Dashboard,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.CONTENT_STUDIO,
    },
    {
      id: AdminNavigationItemId.CONTENT_STUDIO_PRODUCTION,
      label: "Produção",
      description:
        "Crie e desenvolva os materiais para visita por faixa etária.",
      path: "/adm/estudio/producao",
      activePathPrefixes: ["/adm/estudio/pacotes"],
      icon: EditNote,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.CONTENT_STUDIO,
    },
    {
      id: AdminNavigationItemId.CONTENT_STUDIO_REVIEW,
      label: "Revisão",
      description: "Revise conteúdos e acompanhe decisões editoriais.",
      path: "/adm/estudio/revisao",
      icon: RateReview,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlags: [
        FeatureFlagKeys.CONTENT_STUDIO,
        FeatureFlagKeys.CONTENT_STUDIO_REVIEW,
      ],
    },
    {
      id: AdminNavigationItemId.CONTENT_STUDIO_GUIDELINES,
      label: "Orientações",
      description: "Consulte critérios editoriais e de segurança.",
      path: "/adm/estudio/orientacoes",
      icon: Article,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.CONTENT_STUDIO,
    },
  ],
};
