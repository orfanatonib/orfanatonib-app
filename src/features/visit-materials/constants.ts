import { MediaPlatform, MediaType } from '@/store/slices/types';
import {
  TestamentType,
  VisitMaterialCategory,
  VisitMaterialSectionCategory,
  VisitMaterialListTab,
  VisitMaterialMediaSection,
} from './types';

export const VISIT_MATERIAL_ENDPOINT = '/visit-material-pages';
export const VISIT_MATERIAL_CURRENT_ENDPOINT = `${VISIT_MATERIAL_ENDPOINT}/current-material`;
export const VISIT_MATERIAL_PAYLOAD_FIELD = 'visitMaterialsPageData';
export const VISIT_MATERIAL_FILTER_DEBOUNCE_MS = 300;
export const VISIT_MATERIAL_DESCRIPTION_MAX_LENGTH = 100;

export const VISIT_MATERIAL_MESSAGES = {
  LIST_ERROR: 'Erro ao buscar materiais de visita.',
  DETAIL_ERROR:
    'Erro ao carregar os materiais de visita. Tente novamente mais tarde.',
  DELETE_ERROR: 'Erro ao excluir o material de visita.',
  SET_CURRENT_ERROR: 'Erro ao definir o material atual de visita.',
  SAVE_ERROR: 'Erro ao salvar a página.',
  SAVE_SUCCESS: 'Página salva com sucesso!',
  REQUIRED_FIELDS: 'Preencha todos os campos obrigatórios.',
} as const;

export const VISIT_MATERIAL_TESTAMENT_LABELS: Readonly<
  Record<TestamentType, string>
> = {
  [TestamentType.OLD_TESTAMENT]: 'Antigo Testamento',
  [TestamentType.NEW_TESTAMENT]: 'Novo Testamento',
};

export const VISIT_MATERIAL_TAB_LABELS: Readonly<
  Record<VisitMaterialListTab, string>
> = {
  [VisitMaterialListTab.ALL]: '📚 Todos',
  [VisitMaterialListTab.OLD_TESTAMENT]: '📖 Antigo Testamento',
  [VisitMaterialListTab.NEW_TESTAMENT]: '✝️ Novo Testamento',
};

export const VISIT_MATERIAL_TAB_MOBILE_LABELS: Readonly<
  Record<VisitMaterialListTab, string>
> = {
  [VisitMaterialListTab.ALL]: '📚 Todos',
  [VisitMaterialListTab.OLD_TESTAMENT]: '📖 AT',
  [VisitMaterialListTab.NEW_TESTAMENT]: '✝️ NT',
};

export const VISIT_MATERIAL_MEDIA_CONFIG = {
  [VisitMaterialMediaSection.VIDEOS]: {
    label: 'Vídeos',
    mediaType: MediaType.VIDEO,
    icon: '🎥',
    color: '#ff5722',
  },
  [VisitMaterialMediaSection.DOCUMENTS]: {
    label: 'Documentos',
    mediaType: MediaType.DOCUMENT,
    icon: '📄',
    color: '#2196f3',
  },
  [VisitMaterialMediaSection.IMAGES]: {
    label: 'Imagens',
    mediaType: MediaType.IMAGE,
    icon: '🖼️',
    color: '#4caf50',
  },
  [VisitMaterialMediaSection.AUDIOS]: {
    label: 'Áudios',
    mediaType: MediaType.AUDIO,
    icon: '🎵',
    color: '#9c27b0',
  },
} as const;

export const VISIT_MATERIAL_DEFAULT_PLATFORMS: Readonly<
  Record<MediaType, MediaPlatform>
> = {
  [MediaType.VIDEO]: MediaPlatform.YOUTUBE,
  [MediaType.DOCUMENT]: MediaPlatform.GOOGLE_DRIVE,
  [MediaType.IMAGE]: MediaPlatform.GOOGLE_DRIVE,
  [MediaType.AUDIO]: MediaPlatform.GOOGLE_DRIVE,
};

/** Ordem de exibição: Geral primeiro, depois da faixa mais nova para a mais velha. */
export const VISIT_MATERIAL_CATEGORY_ORDER: readonly VisitMaterialCategory[] = [
  VisitMaterialCategory.GENERAL,
  VisitMaterialCategory.BABY,
  VisitMaterialCategory.CHILD,
  VisitMaterialCategory.TEEN,
  VisitMaterialCategory.ADULT,
];

/** Categorias que viram seção na API. */
export const VISIT_MATERIAL_SECTION_CATEGORIES: readonly VisitMaterialSectionCategory[] =
  VISIT_MATERIAL_CATEGORY_ORDER.filter(
    (category): category is VisitMaterialSectionCategory =>
      category !== VisitMaterialCategory.GENERAL,
  );

export const VISIT_MATERIAL_CATEGORY_LABELS: Readonly<
  Record<VisitMaterialCategory, string>
> = {
  [VisitMaterialCategory.GENERAL]: 'Geral',
  [VisitMaterialCategory.BABY]: 'Baby',
  [VisitMaterialCategory.CHILD]: 'Crianças',
  [VisitMaterialCategory.TEEN]: 'Adolescentes',
  [VisitMaterialCategory.ADULT]: 'Adultos',
};

export const VISIT_MATERIAL_CATEGORY_HINTS: Readonly<
  Record<VisitMaterialCategory, string>
> = {
  [VisitMaterialCategory.GENERAL]: 'Vale para todas as faixas etárias.',
  [VisitMaterialCategory.BABY]: '0 a 2 anos',
  [VisitMaterialCategory.CHILD]: '3 a 9 anos',
  [VisitMaterialCategory.TEEN]: '10 a 14 anos',
  [VisitMaterialCategory.ADULT]: '15 anos em diante',
};

/** Prefixo dos campos de arquivo do multipart: evita colisão entre categorias. O Geral mantém o formato antigo. */
export const VISIT_MATERIAL_FIELD_SCOPE: Readonly<
  Record<VisitMaterialCategory, string>
> = {
  [VisitMaterialCategory.GENERAL]: '',
  [VisitMaterialCategory.BABY]: 'baby_',
  [VisitMaterialCategory.CHILD]: 'child_',
  [VisitMaterialCategory.TEEN]: 'teen_',
  [VisitMaterialCategory.ADULT]: 'adult_',
};

/* ───────── Tela administrativa (casca única, filtros no servidor) ───────── */

export const VISIT_MATERIALS_TEST_ID_PREFIX = 'visit-materials';
export const VISIT_MATERIALS_DEFAULT_SORT = 'createdAt:DESC';

export const VISIT_MATERIAL_FILTER_KEYS = {
  TESTAMENT: 'testament',
  CATEGORY: 'category',
  PUBLIC: 'public',
  CURRENT_WEEK: 'currentWeek',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const VISIT_MATERIAL_ADMIN_SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Criação: mais recentes' },
  { value: 'createdAt:ASC', label: 'Criação: mais antigas' },
  { value: 'title:ASC', label: 'Título: A a Z' },
  { value: 'title:DESC', label: 'Título: Z a A' },
  { value: 'testament:ASC', label: 'Testamento: Antigo primeiro' },
  { value: 'testament:DESC', label: 'Testamento: Novo primeiro' },
] as const;

export const VISIT_MATERIAL_PUBLIC_OPTIONS = [
  { value: 'true', label: 'Públicas' },
  { value: 'false', label: 'Privadas' },
] as const;

export const VISIT_MATERIAL_CURRENT_OPTIONS = [
  { value: 'true', label: 'Só o material atual' },
  { value: 'false', label: 'Exceto o atual' },
] as const;

export const VISIT_MATERIALS_LABELS = {
  TITLE: 'Materiais de Visita',
  SEARCH: 'Buscar materiais',
  SEARCH_PLACEHOLDER: 'Buscar materiais por título, subtítulo ou descrição...',
  EMPTY: 'Ainda não há materiais cadastrados.',
  FILTER_TESTAMENT: 'Testamento',
  FILTER_TESTAMENT_ALL: 'Todos os testamentos',
  FILTER_CATEGORY: 'Categoria',
  FILTER_CATEGORY_ALL: 'Todas as faixas',
  FILTER_PUBLIC: 'Visibilidade',
  FILTER_PUBLIC_ALL: 'Públicas e privadas',
  FILTER_CURRENT: 'Material atual',
  FILTER_CURRENT_ALL: 'Atual e demais',
  FILTER_CREATED_FROM: 'Criado a partir de',
  FILTER_CREATED_TO: 'Criado até',
  FILTER_SORT: 'Ordenar por',
  VIEW: 'Ver',
  EDIT: 'Editar',
  DELETE: 'Excluir material',
  SET_CURRENT: 'Tornar material atual',
  CURRENT_CHIP: 'Material Atual',
  PUBLIC: 'Público',
  PRIVATE: 'Privado',
} as const;
