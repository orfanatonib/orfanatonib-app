import api from '@/config/axiosConfig';

import { PENDING_COUNT_ENDPOINTS } from './constants';
import type { PendingCount, PendingCountKind } from './types';

/** Quantos itens da fila aguardam o admin (alimenta o selo do menu e do painel). */
export async function getPendingCount(
  kind: PendingCountKind,
  signal?: AbortSignal,
): Promise<PendingCount> {
  const { data } = await api.get<PendingCount>(PENDING_COUNT_ENDPOINTS[kind], {
    signal,
    skipGlobalError: true,
  });
  return data;
}
