import { MediaPlatform, MediaType } from '@/store/slices/types';
import {
  TestamentType,
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
