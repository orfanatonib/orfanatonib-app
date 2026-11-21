import type { ReactNode } from 'react';

export type AdminActionVariant = 'contained' | 'outlined';

export interface AdminPageShellProps {
  /** `data-testid` da raiz; deriva `-back`, `-heading` e `-actions`. */
  testId: string;
  title: string;
  /** Padrão: voltar uma entrada no histórico. */
  onBack?: () => void;
  /** Slot à direita da linha voltar+título. */
  actions?: ReactNode;
  /** `true` (padrão) usa a largura `xl`; `false` usa a `lg`, mais estreita. */
  fluid?: boolean;
  children: ReactNode;
}

export interface AdminListSkeletonProps {
  testId: string;
  count?: number;
  /** Mostra uma faixa de capa no esqueleto de cada cartão. */
  withCover?: boolean;
}

export interface AdminEmptyStateProps {
  testId: string;
  title?: string;
  message: string;
  icon?: ReactNode;
}

export interface AdminErrorAlertProps {
  testId: string;
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
}

export interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** `data-testid` do campo de texto. */
  testId: string;
  clearTestId?: string;
  refreshTestId?: string;
  rootTestId?: string;
  label?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** Quando informado, exibe o botão de recarregar. */
  onRefresh?: () => void;
  loading?: boolean;
}

export interface AdminCardGridProps {
  testId: string;
  children: ReactNode;
}

export interface AdminVisibilityBadge {
  label: string;
  isPublic: boolean;
  testId?: string;
}

export interface AdminCardAction {
  key: string;
  label: string;
  onClick: () => void;
  testId: string;
  ariaLabel?: string;
  icon?: ReactNode;
  variant?: AdminActionVariant;
}

export interface AdminEntityCardProps {
  testId: string;
  title: string;
  titleTestId?: string;
  subtitle?: string;
  description?: string;
  cover?: ReactNode;
  visibility?: AdminVisibilityBadge;
  meta?: ReactNode;
  onDelete?: () => void;
  deleteTestId?: string;
  deleteLabel?: string;
  actions?: AdminCardAction[];
}
