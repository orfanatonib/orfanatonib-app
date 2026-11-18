import {
  DescriptionOutlined,
  ImageOutlined,
  VideocamOutlined,
} from '@mui/icons-material';
import { MediaType } from '@/store/slices/types';
import type { IdeaMediaGroup } from './types';

export const IDEAS_VIEW_COPY = {
  BACK: 'Voltar',
  EDIT: 'Editar',
  DELETE: 'Excluir',
  LOADING: 'Carregando página de ideias...',
  EMPTY: 'Nenhuma ideia encontrada.',
  EMPTY_SECTION: 'Esta ideia ainda não tem mídias.',
  SHARED_BY: 'Compartilhado por',
} as const;

/** Largura mínima de cada cartão de mídia na grade. */
export const IDEAS_MEDIA_GRID_MIN_WIDTH = 320;

/** Ordem em que os tipos de mídia aparecem dentro de uma seção. */
export const IDEA_MEDIA_GROUPS_CONFIG: ReadonlyArray<Omit<IdeaMediaGroup, 'items'>> = [
  { mediaType: MediaType.VIDEO, label: 'Vídeos', icon: VideocamOutlined, color: '#ff5722' },
  { mediaType: MediaType.DOCUMENT, label: 'Documentos', icon: DescriptionOutlined, color: '#2196f3' },
  { mediaType: MediaType.IMAGE, label: 'Imagens', icon: ImageOutlined, color: '#4caf50' },
];
