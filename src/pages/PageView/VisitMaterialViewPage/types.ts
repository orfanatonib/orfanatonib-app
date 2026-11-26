import type { ReactNode } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';

export interface VisitMediaCardProps {
  /** `data-testid` do cartão (kebab-case, por tipo de mídia). */
  testId: string;
  icon: SvgIconComponent;
  accentColor: string;
  title: string;
  /** Tamanho já formatado (ex.: "1.2 MB"); `null` quando a API não informa. */
  fileSize: string | null;
  description?: string;
  /** Player, pré-visualização ou imagem. */
  children?: ReactNode;
  /** Botões de ação (visualizar, baixar). */
  actions?: ReactNode;
}
