import EventNote from "@mui/icons-material/EventNote";
import Lightbulb from "@mui/icons-material/Lightbulb";
import NoteAdd from "@mui/icons-material/NoteAdd";
import PermMedia from "@mui/icons-material/PermMedia";
import PhotoLibrary from "@mui/icons-material/PhotoLibrary";
import VideoLibrary from "@mui/icons-material/VideoLibrary";

import {
  AdminNavigationItemId,
  AdminNavigationSectionId,
  type AdminNavigationSection,
} from "../types";
import { ADMIN_ONLY_ROLES } from "../roles";

/** Páginas do site (criação e edição) por tipo: materiais, ideias, fotos e vídeos. */
export const ADMIN_PAGES_AND_MEDIA_SECTION: AdminNavigationSection = {
  id: AdminNavigationSectionId.PAGES_AND_MEDIA,
  title: "Páginas e mídias",
  icon: PermMedia,
  items: [
    {
      id: AdminNavigationItemId.CREATE_PAGE,
      label: "Nova página",
      description: "Crie novas páginas de conteúdo para o site.",
      path: "/adm/criar-pagina",
      icon: NoteAdd,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
    {
      id: AdminNavigationItemId.VISIT_MATERIALS,
      label: "Materiais de visita",
      description: "Gerencie materiais para as visitas.",
      path: "/adm/paginas-materiais-visita",
      activePathPrefixes: ["/adm/editar-pagina-visita"],
      icon: EventNote,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
    {
      id: AdminNavigationItemId.IDEAS_PAGES,
      label: "Páginas de ideias",
      description: "Organize páginas com sugestões de atividades.",
      path: "/adm/paginas-ideias",
      activePathPrefixes: ["/adm/editar-pagina-ideias"],
      icon: Lightbulb,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
    {
      id: AdminNavigationItemId.PHOTO_GALLERIES,
      label: "Galerias de fotos",
      description: "Organize galerias de imagens do ministério.",
      path: "/adm/paginas-fotos",
      activePathPrefixes: ["/adm/editar-pagina-imagens"],
      icon: PhotoLibrary,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
    {
      id: AdminNavigationItemId.VIDEOS,
      label: "Vídeos",
      description: "Adicione vídeos e links do YouTube.",
      path: "/adm/paginas-videos",
      activePathPrefixes: ["/adm/editar-pagina-videos"],
      icon: VideoLibrary,
      allowedRoles: ADMIN_ONLY_ROLES,
    },
  ],
};
