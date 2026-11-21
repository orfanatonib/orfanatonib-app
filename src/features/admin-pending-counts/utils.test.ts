import { describe, expect, it } from 'vitest';

import { PENDING_COUNT_ENDPOINTS } from './constants';
import { PendingCountKind } from './types';
import { clampBadgeCount } from './utils';

describe('admin-pending-counts', () => {
  it('limita o selo ao máximo com "+"', () => {
    expect(clampBadgeCount(7, 99)).toBe('7');
    expect(clampBadgeCount(99, 99)).toBe('99');
    expect(clampBadgeCount(100, 99)).toBe('99+');
  });

  it('cada fila tem o seu endpoint de contagem', () => {
    expect(PENDING_COUNT_ENDPOINTS[PendingCountKind.SHARED_IDEAS]).toBe('/ideas-sections/pending-count');
    expect(PENDING_COUNT_ENDPOINTS[PendingCountKind.COMMENTS]).toBe('/comments/pending-count');
  });
});
