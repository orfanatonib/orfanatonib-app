import type { SvgIconComponent } from '@mui/icons-material';
import type { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import type { MediaItem, MediaType } from '@/store/slices/types';

/** Quem compartilhou a ideia (a API só envia quando o usuário tem permissão de ver). */
export interface IdeaSectionAuthor {
  name: string;
  email: string;
  phone?: string;
}

export type IdeaSectionView = IdeasSection & { user?: IdeaSectionAuthor };

export interface IdeaMediaGroup {
  mediaType: MediaType.VIDEO | MediaType.DOCUMENT | MediaType.IMAGE;
  label: string;
  icon: SvgIconComponent;
  color: string;
  items: MediaItem[];
}

export interface IdeaSectionCardProps {
  section: IdeaSectionView;
  /** Posição da seção na página, usada na chave e no `data-testid`. */
  index: number;
}
