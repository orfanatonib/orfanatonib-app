import type { ReactNode } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';

export enum PageViewType {
  GALLERY = 'gallery',
  VIDEOS = 'videos',
  IDEAS = 'ideas',
}

export interface PageViewAccent {
  /** Cor de destaque principal (usada em bordas, skeletons e ícones). */
  color: string;
  /** Início do gradiente do herói. */
  gradientFrom: string;
  /** Fim do gradiente do herói. */
  gradientTo: string;
}

export interface PageViewChip {
  key: string;
  label: string;
}

export interface PageViewHeroTestIds {
  root?: string;
  back?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  chips?: string;
}

export interface PageViewHeroProps {
  type: PageViewType;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: SvgIconComponent;
  chips?: PageViewChip[];
  onBack: () => void;
  backLabel?: string;
  /** Slot das ações de admin (Editar/Excluir). */
  actions?: ReactNode;
  testIds?: PageViewHeroTestIds;
}

export interface PageViewLoadingProps {
  type: PageViewType;
  testId: string;
  /** Quantidade de cartões de esqueleto abaixo do herói. */
  cardCount?: number;
}

export interface PageViewErrorProps {
  testId: string;
  message: string;
}

export interface PageViewEmptyProps {
  testId: string;
  heading: string;
  body?: string;
}
