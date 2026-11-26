import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/axiosConfig', () => ({ default: { post: vi.fn() } }));
vi.mock('@/utils/logger', () => ({ logger: { warn: vi.fn() } }));

import api from '@/config/axiosConfig';
import { logger } from '@/utils/logger';
import { requestServerLogout } from './logoutRequest';

describe('requestServerLogout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama POST /auth/logout', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});
    await requestServerLogout();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('falha de rede não propaga (logout local segue) e é registrada', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'));
    await expect(requestServerLogout()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
