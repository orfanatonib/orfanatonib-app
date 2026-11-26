import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('@/config/axiosConfig', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

import { getPendingCount } from './api';
import { PendingCountKind } from './types';

describe('getPendingCount', () => {
  beforeEach(() => get.mockReset());

  it.each([
    [PendingCountKind.SHARED_IDEAS, '/ideas-sections/pending-count'],
    [PendingCountKind.COMMENTS, '/comments/pending-count'],
    [PendingCountKind.CONTACTS, '/contact/pending-count'],
    [PendingCountKind.FEEDBACKS, '/site-feedbacks/pending-count'],
  ])('lê %s em %s sem erro global', async (kind, url) => {
    get.mockResolvedValue({ data: { pending: 3 } });
    const signal = new AbortController().signal;

    await expect(getPendingCount(kind, signal)).resolves.toEqual({ pending: 3 });
    expect(get).toHaveBeenCalledWith(url, { signal, skipGlobalError: true });
  });
});
