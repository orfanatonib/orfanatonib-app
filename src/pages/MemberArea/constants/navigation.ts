import {
  AutoStoriesOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  LightbulbOutlined,
  VideoLibraryOutlined,
  GroupsOutlined,
  MenuBookOutlined,
  PhotoCameraOutlined,
  ShareOutlined,
  StarRateOutlined,
} from '@mui/icons-material';
import { FeatureFlagKeys } from '@/features/feature-flags/types';
import { MediaTargetType } from '@/store/slices/types';
import {
  MemberNavGroup,
  MemberNavItemId,
  MemberNavRequirement,
  type MemberNavItemDefinition,
} from '../types/navigation';

export const MEMBER_AREA_HOME_PATH = '/area-do-membro';

/** Todas as páginas do membro seguem `/area-do-membro/<slug>`. */
export const MEMBER_SUBPAGE_PATHS = {
  materials: `${MEMBER_AREA_HOME_PATH}/materiais-visita`,
  shareIdea: `${MEMBER_AREA_HOME_PATH}/compartilhar-ideia`,
  photos: `${MEMBER_AREA_HOME_PATH}/imagens-abrigo`,
  manual: `${MEMBER_AREA_HOME_PATH}/manual`,
  rate: `${MEMBER_AREA_HOME_PATH}/avaliar-site`,
  documents: `${MEMBER_AREA_HOME_PATH}/documentos`,
  ideas: `${MEMBER_AREA_HOME_PATH}/ideias`,
  videos: `${MEMBER_AREA_HOME_PATH}/videos`,
  integrations: `${MEMBER_AREA_HOME_PATH}/integracoes`,
} as const;

/** Ferramentas de preparação e contato em destaque na Home. */
export const MEMBER_HOME_QUICK_ACTIONS: readonly string[] = ['materials', 'photos', 'training', 'rate', 'events', 'help'];

/** Atalhos da Home só para admin/líder (a API de integrações é admin/líder); a flag `integration` também vale. */
export const MEMBER_HOME_LEADER_QUICK_ACTIONS: readonly string[] = ['integrations'];

/** Endereços antigos (antes do padrão `/area-do-membro/<slug>`); redirecionam para os novos. */
export const MEMBER_LEGACY_PATH_REDIRECTS: Readonly<Record<string, string>> = {
  '/lista-materias-visita': MEMBER_SUBPAGE_PATHS.materials,
  '/compartilhar-ideia': MEMBER_SUBPAGE_PATHS.shareIdea,
  '/imagens-abrigo': MEMBER_SUBPAGE_PATHS.photos,
  '/manual-membro': MEMBER_SUBPAGE_PATHS.manual,
  '/avaliar-site': MEMBER_SUBPAGE_PATHS.rate,
  '/adm/integracoes': MEMBER_SUBPAGE_PATHS.integrations,
};

export const MEMBER_AREA_TITLE = 'Área do Membro';
export const MEMBER_AREA_SUBTITLE = 'Seu espaço dedicado para materiais, recursos e inspiração';

export const MEMBER_NAV_ITEMS: readonly MemberNavItemDefinition[] = [
  {
    id: MemberNavItemId.Overview,
    description: 'Avisos, banners da semana e o mural da comunidade.',
    label: 'Home',
    to: MEMBER_AREA_HOME_PATH,
    icon: DashboardOutlined,
    accentColor: '#1565c0',
    group: MemberNavGroup.Area,
    exact: true,
    hidePageHeader: true,
  },
  {
    id: MemberNavItemId.Materials,
    description: 'Materiais para preparar e conduzir a visita ao abrigo.',
    label: 'Materiais de Visita',
    to: MEMBER_SUBPAGE_PATHS.materials,
    icon: MenuBookOutlined,
    accentColor: '#0284c7',
    group: MemberNavGroup.Area,
  },
  {
    id: MemberNavItemId.Documents,
    description: 'Documentos importantes da coordenação para consulta e download.',
    label: 'Documentos',
    to: MEMBER_SUBPAGE_PATHS.documents,
    icon: DescriptionOutlined,
    accentColor: '#0284c7',
    group: MemberNavGroup.Area,
  },
  {
    id: MemberNavItemId.Ideas,
    description: 'Ideias de atividades compartilhadas por outros membros.',
    label: 'Galeria de Ideias',
    to: MEMBER_SUBPAGE_PATHS.ideas,
    icon: LightbulbOutlined,
    accentColor: '#9333ea',
    group: MemberNavGroup.Area,
  },
  {
    id: MemberNavItemId.Videos,
    description: 'Vídeos de treinamento para servir com excelência.',
    label: 'Vídeos de Treinamento',
    to: MEMBER_SUBPAGE_PATHS.videos,
    icon: VideoLibraryOutlined,
    accentColor: '#4f46e5',
    group: MemberNavGroup.Area,
  },
  {
    id: MemberNavItemId.ShareIdea,
    description: 'Envie uma brincadeira, um versículo ou uma história, com vídeos, imagens ou documentos.',
    label: 'Compartilhar Ideia',
    to: MEMBER_SUBPAGE_PATHS.shareIdea,
    icon: ShareOutlined,
    accentColor: '#7c3aed',
    group: MemberNavGroup.Area,
  },
  {
    id: MemberNavItemId.Photos,
    description: 'Registre e compartilhe os momentos especiais das atividades do seu abrigo.',
    label: 'Fotos do Abrigo',
    to: MEMBER_SUBPAGE_PATHS.photos,
    icon: PhotoCameraOutlined,
    accentColor: '#16a34a',
    group: MemberNavGroup.Area,
    featureKey: FeatureFlagKeys.SHELTER_PHOTO_UPLOAD,
  },
  {
    id: MemberNavItemId.Manual,
    description: 'Diretrizes e princípios para servir com excelência e impactar a próxima geração.',
    label: 'Manual do Membro',
    to: MEMBER_SUBPAGE_PATHS.manual,
    icon: AutoStoriesOutlined,
    accentColor: '#ed6c02',
    group: MemberNavGroup.Area,
  },
  {
    id: MemberNavItemId.Rate,
    description: 'Conte como está sendo sua experiência para melhorarmos a plataforma.',
    label: 'Avalie o Site',
    to: MEMBER_SUBPAGE_PATHS.rate,
    icon: StarRateOutlined,
    accentColor: '#2e7d32',
    group: MemberNavGroup.More,
  },
  {
    id: MemberNavItemId.Integrations,
    description: 'Gerencie as integrações de pessoas na Feira de Ministério.',
    label: 'Integrações FM',
    to: MEMBER_SUBPAGE_PATHS.integrations,
    icon: GroupsOutlined,
    accentColor: '#9c27b0',
    group: MemberNavGroup.More,
    requires: MemberNavRequirement.AdminOrLeader,
    featureKey: FeatureFlagKeys.INTEGRATION,
  },
];

export const MEMBER_NAV_GROUP_ORDER: readonly MemberNavGroup[] = [
  MemberNavGroup.Area,
  MemberNavGroup.More,
];

export const MEMBER_NAV_GROUP_LABELS: Record<MemberNavGroup, string> = {
  [MemberNavGroup.Area]: 'Área do Membro',
  [MemberNavGroup.More]: 'Mais',
};

/**
 * Páginas de conteúdo (rotas dinâmicas) que abrem dentro da casca da Área do Membro.
 * `ShelterPage` é pública e fica de fora.
 */
export const MEMBER_AREA_DYNAMIC_ENTITY_TYPES: readonly string[] = [
  MediaTargetType.VisitMaterialsPage,
  MediaTargetType.VideosPage,
  MediaTargetType.ImagesPage,
  MediaTargetType.IdeasPage,
];

/** Prefixo do endereço de cada página de conteúdo aberta por id: `<prefixo>/:id`. */
export const MEMBER_CONTENT_PAGE_BASE_PATH: Readonly<Record<string, string>> = {
  [MediaTargetType.VisitMaterialsPage]: MEMBER_SUBPAGE_PATHS.materials,
  [MediaTargetType.IdeasPage]: MEMBER_SUBPAGE_PATHS.ideas,
  [MediaTargetType.VideosPage]: MEMBER_SUBPAGE_PATHS.videos,
};

/** Item do menu que fica ativo quando uma página dinâmica do tipo está aberta. */
export const ENTITY_TYPE_NAV_ITEM: Readonly<Record<string, MemberNavItemId>> = {
  [MediaTargetType.VisitMaterialsPage]: MemberNavItemId.Materials,
  [MediaTargetType.IdeasPage]: MemberNavItemId.Ideas,
  [MediaTargetType.VideosPage]: MemberNavItemId.Videos,
};

export const MEMBER_SHELL_LAYOUT = {
  /** Largura da casca em relação à janela. */
  width: { xs: '98%', md: '95%' },
  headerMinHeight: { xs: 64, md: 88 },
  pageHeaderMinHeight: { xs: 72, md: 80 },
  contentMinHeight: { xs: '55vh', md: '70vh' },
} as const;

export const MEMBER_SIDEBAR_LAYOUT = {
  expandedWidth: 256,
  collapsedWidth: 68,
  desktopTop: 84,
  mobileTop: 56,
  mobileZIndex: 1100,
  touchTarget: 44,
} as const;

/** Aparência única dos cartões das subpáginas (mesma borda, raio e fundo em todas). */
export const MEMBER_CARD_SX = {
  p: { xs: 2, md: 3 },
  borderRadius: 3,
  border: '1px solid #dbe4f0',
  bgcolor: '#ffffff',
  boxShadow: 'none',
} as const;

/** Abas das subpáginas: o hover do tema pinta o botão de verde forte, então aqui ele é neutro. */
export const MEMBER_TABS_SX = {
  mb: 2.5,
  borderBottom: 1,
  borderColor: 'divider',
  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
  '& .MuiTab-root:hover': { backgroundColor: 'rgba(15, 41, 66, 0.04)' },
} as const;
