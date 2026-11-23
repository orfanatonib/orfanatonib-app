import type { ReactNode } from 'react';

export interface PersonCardAction {
  /** Compõe o `data-testid`: `<prefix>-<key>-<id>`. */
  key: string;
  label: string;
  ariaLabel: string;
  icon: ReactNode;
  onClick: () => void;
  color?: 'primary' | 'error' | 'inherit';
}

export interface PersonCardProps {
  /** Prefixo dos `data-testid` (`users-card`, `leaders-card`...). */
  testIdPrefix: string;
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarColor: string;
  /** Selos logo abaixo do nome (papel, situação). */
  badges?: ReactNode;
  /** Conteúdo específico da entidade (abrigos, equipes...). */
  children?: ReactNode;
  /** Linha discreta no rodapé (datas). */
  footnote?: string;
  whatsappHref: string | null;
  actions: PersonCardAction[];
}

export interface SortHeadCellProps {
  label: string;
  testId: string;
  active: boolean;
  direction: 'asc' | 'desc';
  onClick: () => void;
  width?: number | string;
}
