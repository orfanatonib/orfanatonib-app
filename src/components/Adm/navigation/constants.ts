import Article from "@mui/icons-material/Article";
import Badge from "@mui/icons-material/Badge";
import Build from "@mui/icons-material/Build";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Campaign from "@mui/icons-material/Campaign";
import Chat from "@mui/icons-material/Chat";
import Collections from "@mui/icons-material/Collections";
import Comment from "@mui/icons-material/Comment";
import ContactMail from "@mui/icons-material/ContactMail";
import Dashboard from "@mui/icons-material/Dashboard";
import Description from "@mui/icons-material/Description";
import EventAvailable from "@mui/icons-material/EventAvailable";
import EventNote from "@mui/icons-material/EventNote";
import Favorite from "@mui/icons-material/Favorite";
import Group from "@mui/icons-material/Group";
import Groups from "@mui/icons-material/Groups";
import Handshake from "@mui/icons-material/Handshake";
import HomeWork from "@mui/icons-material/HomeWork";
import Lightbulb from "@mui/icons-material/Lightbulb";
import MenuBook from "@mui/icons-material/MenuBook";
import NoteAdd from "@mui/icons-material/NoteAdd";
import People from "@mui/icons-material/People";
import PermMedia from "@mui/icons-material/PermMedia";
import PhotoLibrary from "@mui/icons-material/PhotoLibrary";
import RateReview from "@mui/icons-material/RateReview";
import School from "@mui/icons-material/School";
import SupervisorAccount from "@mui/icons-material/SupervisorAccount";
import VideoLibrary from "@mui/icons-material/VideoLibrary";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  AdminNavigationItemId,
  AdminNavigationRole,
  AdminNavigationSectionId,
  type AdminNavigationFilter,
  type AdminNavigationSection,
} from "./types";

const ADMIN_ONLY_ROLES = [AdminNavigationRole.ADMIN] as const;
const ADMIN_AND_LEADER_ROLES = [
  AdminNavigationRole.ADMIN,
  AdminNavigationRole.LEADER,
] as const;

export const ADMIN_OVERVIEW_ITEM = {
  label: "Visão geral",
  path: "/adm",
  icon: Dashboard,
} as const;

export const ADMIN_NAVIGATION_SECTIONS: readonly AdminNavigationSection[] = [
  {
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
        requiredFeatureFlag: FeatureFlagKeys.SHELTER_MANAGEMENT,
      },
      {
        id: AdminNavigationItemId.MEMBERS,
        label: "Membros",
        description: "Gerencie membros voluntários do ministério.",
        path: "/adm/membros",
        icon: School,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
      },
      {
        id: AdminNavigationItemId.LEADERS,
        label: "Líderes",
        description: "Gerencie líderes responsáveis pelos abrigos.",
        path: "/adm/lideres",
        icon: SupervisorAccount,
        allowedRoles: ADMIN_ONLY_ROLES,
      },
      {
        id: AdminNavigationItemId.PROFILES,
        label: "Perfis",
        description: "Conheça melhor as pessoas do ministério.",
        path: "/adm/perfis",
        icon: Favorite,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
      },
      {
        id: AdminNavigationItemId.USERS,
        label: "Usuários",
        description: "Gerencie contas de acesso ao sistema.",
        path: "/adm/usuarios",
        icon: Group,
        allowedRoles: ADMIN_ONLY_ROLES,
      },
      {
        id: AdminNavigationItemId.BACKGROUND_CHECKS,
        label: "Antecedentes Criminais",
        description: "Gerencie antecedentes criminais e documentos vinculados.",
        path: "/adm/antecedentes",
        icon: Badge,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
      },
    ],
  },
  {
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
      },
      {
        id: AdminNavigationItemId.SCHEDULES,
        label: "Agendamentos",
        description: "Agende reuniões e visitas aos abrigos.",
        path: "/adm/agendamentos",
        icon: CalendarMonth,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
      },
      {
        id: AdminNavigationItemId.ATTENDANCE,
        label: "Presenças",
        description: "Gerencie a frequência das equipes e membros.",
        path: "/adm/presenca",
        activePathPrefixes: ["/adm/presenca/pendencias"],
        icon: EventAvailable,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
      },
      {
        id: AdminNavigationItemId.VISIT_REPORTS,
        label: "Relatórios das Visitas",
        description: "Gerencie os relatórios das visitas realizadas.",
        path: "/adm/relatorios-visita",
        activePathPrefixes: ["/adm/relatorios/pendencias"],
        icon: Description,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
      },
      {
        id: AdminNavigationItemId.PAGELAS,
        label: "Pagelas",
        description: "Gerencie pagelas de presença e atividades.",
        path: "/adm/pagelas",
        icon: Description,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
        requiredFeatureFlag: FeatureFlagKeys.SHELTER_PAGELAS,
      },
      {
        id: AdminNavigationItemId.FM_INTEGRATIONS,
        label: "Integrações FM",
        description: "Gerencie integrações de pessoas na Feira de Ministério.",
        path: "/adm/integracoes",
        icon: Handshake,
        allowedRoles: ADMIN_AND_LEADER_ROLES,
      },
    ],
  },
  {
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
      },
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
  },
  {
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
      },
      {
        id: AdminNavigationItemId.IDEAS_PAGES,
        label: "Páginas de Ideias",
        description: "Organize páginas com sugestões de atividades.",
        path: "/adm/paginas-ideias",
        activePathPrefixes: ["/adm/editar-pagina-ideias"],
        icon: Lightbulb,
        allowedRoles: ADMIN_ONLY_ROLES,
      },
      {
        id: AdminNavigationItemId.SHARED_IDEAS,
        label: "Ideias Compartilhadas",
        description: "Veja ideias enviadas pelos abrigos.",
        path: "/adm/ideias-compartilhadas",
        activePathPrefixes: ["/adm/editar-ideias-compartilhadas"],
        icon: Lightbulb,
        allowedRoles: ADMIN_ONLY_ROLES,
      },
    ],
  },
  {
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
      },
      {
        id: AdminNavigationItemId.SHELTER_PHOTOS,
        label: "Fotos dos Abrigos",
        description: "Gerencie fotos específicas de cada abrigo.",
        path: "/adm/fotos-abrigos",
        activePathPrefixes: ["/adm/editar-imagens-shelter"],
        icon: Collections,
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
  },
  {
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
      },
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
  },
];

export const ADMIN_NAVIGATION_FILTER_ALL_ID = "all" as const;

export const ADMIN_NAVIGATION_FILTERS: readonly AdminNavigationFilter[] = [
  { id: ADMIN_NAVIGATION_FILTER_ALL_ID, label: "Tudo" },
  ...ADMIN_NAVIGATION_SECTIONS.map(({ id, title }) => ({ id, label: title })),
];

export const ADMIN_NAVIGATION_TEST_IDS = {
  LAYOUT: "admin-layout",
  MAIN: "admin-main",
  DASHBOARD: "admin-dashboard",
  SIDEBAR: "admin-sidebar",
  SIDEBAR_NAVIGATION: "admin-sidebar-navigation",
  SIDEBAR_OVERVIEW: "admin-sidebar-overview",
  SIDEBAR_GROUP_PREFIX: "admin-sidebar-group",
  SIDEBAR_GROUP_TOGGLE_PREFIX: "admin-sidebar-group-toggle",
  SIDEBAR_ITEM_PREFIX: "admin-sidebar-item",
  SIDEBAR_FILTER_PREFIX: "admin-sidebar-filter",
  SIDEBAR_COLLAPSE: "admin-sidebar-collapse",
  SIDEBAR_OPEN: "admin-sidebar-open",
  DASHBOARD_FILTER_PREFIX: "admin-dashboard-filter",
  DASHBOARD_CARD_PREFIX: "admin-dashboard-card",
  DASHBOARD_SEARCH: "admin-dashboard-search",
  DASHBOARD_EMPTY: "admin-dashboard-empty",
  DASHBOARD_SCROLL_TOP: "admin-dashboard-scroll-top",
} as const;

export const ADMIN_DRAWER_WIDTH_PX = 240;
export const ADMIN_MINI_DRAWER_WIDTH_PX = 72;
export const ADMIN_HEADER_HEIGHT_PX = 64;
export const ADMIN_FOOTER_HEIGHT_PX = 88;
