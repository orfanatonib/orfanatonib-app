import type { ReactElement } from 'react';

export type AdminChipRowColor = 'default' | 'primary' | 'success' | 'info' | 'warning' | 'error';

export interface AdminChipRowItem {
  key: string;
  label: string;
  testId: string;
  color?: AdminChipRowColor;
  icon?: ReactElement;
}

export interface AdminChipRowProps {
  /** `data-testid` da linha de chips. */
  testId: string;
  chips: AdminChipRowItem[];
}
