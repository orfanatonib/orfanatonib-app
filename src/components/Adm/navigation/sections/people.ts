import Badge from "@mui/icons-material/Badge";
import Favorite from "@mui/icons-material/Favorite";
import Group from "@mui/icons-material/Group";
import People from "@mui/icons-material/People";
import School from "@mui/icons-material/School";
import SupervisorAccount from "@mui/icons-material/SupervisorAccount";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES, ADMIN_AND_LEADER_ROLES } from "../roles";

export const ADMIN_PEOPLE_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.PEOPLE,
  title: "Pessoas",
  icon: People,
  items: [
    {
      id: AdminNavigationItemId.SHELTERED,
      label: "Acolhidos",
      description: "Gerencie crianças e jovens dos abrigos.",
      path: "/adm/acolhidos",
      icon: Group,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.SHELTERED_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.MEMBERS,
      label: "Membros",
      description: "Gerencie membros voluntários do ministério.",
      path: "/adm/membros",
      icon: School,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.MEMBER_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.LEADERS,
      label: "Líderes",
      description: "Gerencie líderes responsáveis pelos abrigos.",
      path: "/adm/lideres",
      icon: SupervisorAccount,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.LEADER_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.USERS,
      label: "Usuários",
      description: "Gerencie contas de acesso ao sistema.",
      path: "/adm/usuarios",
      icon: Group,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.USER_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.BACKGROUND_CHECKS,
      label: "Antecedentes Criminais",
      description: "Gerencie antecedentes criminais e documentos vinculados.",
      path: "/adm/antecedentes",
      icon: Badge,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.CRIMINAL_RECORDS,
    },
    {
      id: AdminNavigationItemId.PROFILES,
      label: "Perfis",
      description: "Conheça melhor as pessoas do ministério.",
      path: "/adm/perfis",
      icon: Favorite,
      allowedRoles: ADMIN_AND_LEADER_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.USER_MANAGEMENT,
    },
  ],
};
