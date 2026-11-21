import type { ReactNode } from 'react';

/** Filas de aprovação do admin que mostram o selo de pendentes no menu e no painel. */
export enum PendingCountKind {
  SHARED_IDEAS = 'shared-ideas',
  COMMENTS = 'comments',
}

/** `GET <fila>/pending-count`: quantos itens aguardam o admin. */
export interface PendingCount {
  pending: number;
}

export interface PendingCountBadgeProps {
  kind: PendingCountKind;
  children: ReactNode;
}
