import api from '@/config/axiosConfig';
import { logger } from '@/utils/logger';

/**
 * Avisa a API do logout. Falha de rede não impede o logout local (a sessão
 * precisa terminar no cliente de qualquer jeito), mas é registrada — nunca
 * engolida em silêncio.
 */
export async function requestServerLogout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error: unknown) {
    logger.warn('Logout no servidor falhou; encerrando só a sessão local', { feature: 'auth', action: 'logout' }, error);
  }
}
