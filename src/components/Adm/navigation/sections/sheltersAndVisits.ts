import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Description from "@mui/icons-material/Description";
import EventAvailable from "@mui/icons-material/EventAvailable";
import Forum from "@mui/icons-material/Forum";
import Groups from "@mui/icons-material/Groups";
import HomeWork from "@mui/icons-material/HomeWork";

import { FeatureFlagKeys } from "@/features/feature-flags/types";
import { FEED_COMMENTS_ADMIN_ROUTE } from "@/features/feed-comments/constants";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_AND_LEADER_ROLES, ADMIN_ONLY_ROLES } from "../roles";

export const ADMIN_SHELTERS_AND_VISITS_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.SHELTERS_AND_VISITS,
  title: "Abrigos e visitas",
  icon: HomeWork,
  items: [
    {
      id: AdminNavigationItemId.SHELTERS,
      label: "Abrigos",
      description: "Cadastre e gerencie os abrigos parceiros.",
      path: "/adm/abrigos",
      icon: Groups,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.SHELTER_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.SCHEDULES,
      label: "Agendamentos",
      description: "Agende reuniões e visitas aos abrigos.",
      path: "/adm/agendamentos",
      icon: CalendarMonth,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.SHELTER_SCHEDULE,
    },
    {
      id: AdminNavigationItemId.ATTENDANCE,
      label: "Presenças",
      description: "Gerencie a frequência das equipes e membros.",
      path: "/adm/presenca",
      activePathPrefixes: ["/adm/presenca/pendencias"],
      icon: EventAvailable,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.ATTENDANCE,
    },
    {
      id: AdminNavigationItemId.VISIT_REPORTS,
      label: "Relatórios das Visitas",
      description: "Gerencie os relatórios das visitas realizadas.",
      path: "/adm/relatorios-visita",
      activePathPrefixes: ["/adm/relatorios/pendencias"],
      icon: Description,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.VISIT_REPORTS,
    },
    {
      id: AdminNavigationItemId.PAGELAS,
      label: "Pagelas",
      description: "Gerencie pagelas de presença e atividades.",
      path: "/adm/pagelas",
      icon: Description,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.PAGELAS,
    },
    {
      id: AdminNavigationItemId.FEED_COMMENTS,
      label: "Comentários do Feed",
      description: "Aprove ou reprove os comentários do feed dos abrigos.",
      path: FEED_COMMENTS_ADMIN_ROUTE,
      icon: Forum,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlags: [
        FeatureFlagKeys.SHELTER_FEED,
        FeatureFlagKeys.SHELTER_FEED_COMMENTS,
      ],
    },
  ],
};
