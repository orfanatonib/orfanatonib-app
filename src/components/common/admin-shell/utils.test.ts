import { describe, expect, it } from 'vitest';
import {
  buildAdminTestId,
  clampSkeletonCount,
  resolveCardTitle,
  resolveEmptyMessage,
  visibilityDescriptor,
} from './utils';
import {
  ADMIN_LABELS,
  ADMIN_SKELETON_DEFAULT_COUNT,
  ADMIN_SKELETON_MAX_COUNT,
  ADMIN_SKELETON_MIN_COUNT,
} from './constants';

describe('admin-shell utils', () => {
  it('buildAdminTestId junta raiz e sufixo', () => {
    expect(buildAdminTestId('image-pages-manager', 'back')).toBe('image-pages-manager-back');
  });

  it('clampSkeletonCount aplica padrão e limites', () => {
    expect(clampSkeletonCount(undefined)).toBe(ADMIN_SKELETON_DEFAULT_COUNT);
    expect(clampSkeletonCount(Number.NaN)).toBe(ADMIN_SKELETON_DEFAULT_COUNT);
    expect(clampSkeletonCount(0)).toBe(ADMIN_SKELETON_MIN_COUNT);
    expect(clampSkeletonCount(999)).toBe(ADMIN_SKELETON_MAX_COUNT);
    expect(clampSkeletonCount(3.9)).toBe(3);
  });

  it('visibilityDescriptor distingue pública e privada', () => {
    expect(visibilityDescriptor(true)).toEqual({ label: ADMIN_LABELS.PUBLIC, color: 'success' });
    expect(visibilityDescriptor(false)).toEqual({ label: ADMIN_LABELS.PRIVATE, color: 'default' });
  });

  it('resolveEmptyMessage prioriza a mensagem de busca', () => {
    expect(resolveEmptyMessage(true, 'vazio')).toBe(ADMIN_LABELS.EMPTY_FILTERED);
    expect(resolveEmptyMessage(false, 'vazio')).toBe('vazio');
  });

  it('resolveCardTitle usa reserva para título vazio', () => {
    expect(resolveCardTitle('  ')).toBe(ADMIN_LABELS.UNTITLED);
    expect(resolveCardTitle(undefined)).toBe(ADMIN_LABELS.UNTITLED);
    expect(resolveCardTitle(' A ')).toBe('A');
  });
});
