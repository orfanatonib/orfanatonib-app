import { store } from '@/store/slices';
import { showError, showInfo, showWarning } from '@/store/slices/notification/notificationSlice';
import { LOGIN_PATH } from './notification.constants';
import type { NotificationActionKind, NotificationPlan } from './notification.types';

const ACTION_HANDLERS: Record<NotificationActionKind, () => void> = {
  reload: () => window.location.reload(),
  login: () => {
    window.location.href = LOGIN_PATH;
  },
  back: () => window.history.back(),
};

export function dispatchNotification(message: string, plan: NotificationPlan): void {
  const config = {
    position: plan.position,
    persistent: plan.persistent,
    title: plan.title,
    description: plan.description,
    duration: plan.duration,
    action: plan.action
      ? { label: plan.action.label, onClick: ACTION_HANDLERS[plan.action.kind] }
      : undefined,
  };
  if (plan.level === 'error') store.dispatch(showError(message, config));
  else if (plan.level === 'warning') store.dispatch(showWarning(message, config));
  else store.dispatch(showInfo(message, config));
}
