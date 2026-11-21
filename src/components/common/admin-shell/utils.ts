import {
  ADMIN_LABELS,
  ADMIN_SKELETON_DEFAULT_COUNT,
  ADMIN_SKELETON_MAX_COUNT,
  ADMIN_SKELETON_MIN_COUNT,
} from './constants';

/** Compõe o `data-testid` de um elemento derivado da raiz. */
export function buildAdminTestId(base: string, suffix: string): string {
  return `${base}-${suffix}`;
}

/** Limita a quantidade de cartões do esqueleto a um intervalo seguro. */
export function clampSkeletonCount(count: number | undefined): number {
  if (count === undefined || !Number.isFinite(count)) return ADMIN_SKELETON_DEFAULT_COUNT;
  const whole = Math.trunc(count);
  return Math.min(ADMIN_SKELETON_MAX_COUNT, Math.max(ADMIN_SKELETON_MIN_COUNT, whole));
}

/** Rótulo e cor do selo de visibilidade. */
export function visibilityDescriptor(isPublic: boolean): {
  label: string;
  color: 'success' | 'default';
} {
  return isPublic
    ? { label: ADMIN_LABELS.PUBLIC, color: 'success' }
    : { label: ADMIN_LABELS.PRIVATE, color: 'default' };
}

/** Texto do estado vazio conforme haja busca ativa ou não. */
export function resolveEmptyMessage(hasQuery: boolean, emptyMessage: string): string {
  return hasQuery ? ADMIN_LABELS.EMPTY_FILTERED : emptyMessage;
}

/** Título do cartão com valor de reserva quando vazio. */
export function resolveCardTitle(title: string | null | undefined): string {
  const trimmed = (title ?? '').trim();
  return trimmed || ADMIN_LABELS.UNTITLED;
}
