import { PageTemplateOption, PageTemplateType } from './types';

export const PAGE_TEMPLATE_OPTIONS: PageTemplateOption[] = [
  {
    key: PageTemplateType.VISIT_MATERIALS,
    title: 'Materiais de Visita',
    subtitle: 'Orientação e conteúdos de visitas',
    description: 'Crie uma página estruturada com orientações, áudios, vídeos e documentos para as equipes de visita nos abrigos.',
    iconName: 'visit',
    path: 'materiais-de-visita',
    testId: 'page-template-card-visit-materials',
  },
  {
    key: PageTemplateType.MEDITATION,
    title: 'Meditação da Semana',
    subtitle: 'Conteúdo devocional semanal',
    description: 'Crie uma meditação bíblica semanal com texto devocional, áudios explicativos e vídeos.',
    iconName: 'meditation',
    path: 'meditacao',
    testId: 'page-template-card-meditation',
  },
  {
    key: PageTemplateType.GALLERY,
    title: 'Galeria de Fotos',
    subtitle: 'Registro fotográfico das atividades',
    description: 'Crie uma galeria organizada em seções com fotos em alta resolução registrando as ações nos abrigos.',
    iconName: 'gallery',
    path: 'galeria-de-fotos',
    testId: 'page-template-card-gallery',
  },
  {
    key: PageTemplateType.VIDEOS,
    title: 'Galeria de Vídeos',
    subtitle: 'Conteúdos em vídeo e mídia',
    description: 'Crie uma página para disponibilizar vídeos institucionais, aulas e registos multimídia para os líderes.',
    iconName: 'videos',
    path: 'galeria-de-videos',
    testId: 'page-template-card-videos',
  },
  {
    key: PageTemplateType.IDEAS,
    title: 'Página de Ideias',
    subtitle: 'Materiais criativos e dinâmicas',
    description: 'Crie uma página de recursos contendo dinâmicas, imagens, arquivos e ideias práticas para os momentos com as crianças.',
    iconName: 'ideas',
    path: 'ideias',
    testId: 'page-template-card-ideas',
  },
];

export const PAGE_CREATOR_BASE_PATH = '/adm/criar-pagina';

export const PAGE_CREATOR_TEST_IDS = {
  CONTAINER: 'page-creator-select-template-container',
  HEADER: 'page-creator-select-template-header',
  SUBTITLE: 'page-creator-select-template-subtitle',
  GRID: 'page-creator-card-grid',
  CARD_PREFIX: 'page-template-card-',
  CHANGE_BUTTON: 'page-creator-change-template-btn',
  BACK_BUTTON: 'page-creator-back-to-cards-btn',
  CLEAR_BUTTON: 'page-creator-clear-template-btn',
  SELECTED_PREVIEW: 'page-creator-selected-template-preview',
  ACTIVE_BANNER: 'page-creator-active-banner',
} as const;
