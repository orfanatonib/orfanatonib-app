import { useSelector } from 'react-redux';
import { FeatureFlagKeys, useIsFeatureEnabled } from '@/features/feature-flags';
import type { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';

export interface InboxAccess {
  /** Quem é o dono do cache; `null` sem sessão. */
  userId: string | null;
  enabled: boolean;
}

/**
 * A caixa de entrada só consulta com sessão resolvida, a flag ligada e perfil admin (os avisos dos Estúdios
 * vão aos administradores). Sem isso, nenhuma consulta e nenhum polling.
 */
export function useInboxAccess(): InboxAccess {
  const { user, isAuthenticated, initialized } = useSelector((state: RootState) => state.auth);
  const flagOn = useIsFeatureEnabled(FeatureFlagKeys.NOTIFICATION_CENTER);
  const userId = isAuthenticated && user ? user.id : null;
  const enabled = initialized && Boolean(userId) && flagOn && user?.role === UserRole.ADMIN && user.active !== false;
  return { userId, enabled };
}
