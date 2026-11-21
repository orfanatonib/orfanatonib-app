import Chat from "@mui/icons-material/Chat";
import ContactMail from "@mui/icons-material/ContactMail";
import RateReview from "@mui/icons-material/RateReview";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

/** Mensagens que chegam de fora: contatos e feedbacks. */
export const ADMIN_MESSAGES_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.MESSAGES,
  title: "Mensagens",
  icon: Chat,
  items: [
    {
      id: AdminNavigationItemId.CONTACTS,
      label: "Contatos",
      description: "Visualize mensagens de contato recebidas.",
      path: "/adm/contatos",
      icon: ContactMail,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
    {
      id: AdminNavigationItemId.FEEDBACKS,
      label: "Feedbacks",
      description: "Analise feedbacks enviados pelos usuários.",
      path: "/adm/feedbacks",
      icon: RateReview,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
  ],
};
