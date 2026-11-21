import type { ApiErrorResponse, ErrorCategory, ErrorRecoverability, ErrorSeverity } from '@/types/error';
import type { NotificationPosition } from '@/store/slices/notification/notificationSlice';

export type NotificationLevel = 'error' | 'warning' | 'info';

/** Ação do toast descrita como dado; `notification.dispatch` a transforma em callback. */
export type NotificationActionKind = 'reload' | 'login' | 'back';

export interface NotificationPlan {
  level: NotificationLevel;
  position: NotificationPosition;
  persistent: boolean;
  title?: string;
  description?: string;
  action?: { label: string; kind: NotificationActionKind };
  duration?: number;
}

export interface NotificationPlanInput {
  apiData?: ApiErrorResponse;
  status?: number;
  analysis: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverability: ErrorRecoverability;
  };
}
