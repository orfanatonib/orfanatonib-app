import Chat from "@mui/icons-material/Chat";
import Comment from "@mui/icons-material/Comment";
import ContactMail from "@mui/icons-material/ContactMail";
import RateReview from "@mui/icons-material/RateReview";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

export const ADMIN_COMMUNICATION_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.COMMUNICATION,
  title: "Comunicação",
  icon: Chat,
  items: [
    {
      id: AdminNavigationItemId.COMMENTS,
      label: "Comentários",
      description: "Modere comentários dos usuários.",
      path: "/adm/comentarios",
      icon: Comment,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.COMMENT_MODERATION,
    },
    {
      id: AdminNavigationItemId.CONTACTS,
      label: "Contatos",
      description: "Visualize mensagens de contato recebidas.",
      path: "/adm/contatos",
      icon: ContactMail,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.CONTACT_MANAGEMENT,
    },
    {
      id: AdminNavigationItemId.FEEDBACKS,
      label: "Feedbacks",
      description: "Analise feedbacks enviados pelos usuários.",
      path: "/adm/feedbacks",
      icon: RateReview,
      allowedRoles: ADMIN_ONLY_ROLES,
      requiredFeatureFlag: FeatureFlagKeys.FEEDBACK_MANAGEMENT,
    },
  ],
};
