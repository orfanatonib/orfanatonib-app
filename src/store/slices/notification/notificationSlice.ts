import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationVariant = 'filled' | 'outlined' | 'standard';
export type NotificationPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'text' | 'outlined' | 'contained';
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
  variant?: NotificationVariant;
  position?: NotificationPosition;
  title?: string;
  description?: string;
  action?: NotificationAction;
  persistent?: boolean;
  showIcon?: boolean;
  elevation?: number;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id'>>
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      state.notifications.push({
        id,
        variant: 'filled',
        position: 'bottom-center',
        showIcon: true,
        elevation: 3,
        ...action.payload,
      });

      if (state.notifications.length > 5) {
        state.notifications = state.notifications.slice(-5);
      }
    },
    hideNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    updateNotification: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Notification> }>
    ) => {
      const notification = state.notifications.find(n => n.id === action.payload.id);
      if (notification) {
        Object.assign(notification, action.payload.updates);
      }
    },
  },
});

export const { showNotification, hideNotification, clearAllNotifications, updateNotification } =
  notificationSlice.actions;

// Enhanced helper functions with more options
export const showError = (
  message: string,
  options: Partial<Omit<Notification, 'id' | 'message' | 'type'>> = {}
) =>
  showNotification({
    message,
    type: 'error',
    duration: 8000,
    variant: 'filled',
    ...options
  });

export const showSuccess = (
  message: string,
  options: Partial<Omit<Notification, 'id' | 'message' | 'type'>> = {}
) =>
  showNotification({
    message,
    type: 'success',
    duration: 4000,
    variant: 'filled',
    ...options
  });

export const showWarning = (
  message: string,
  options: Partial<Omit<Notification, 'id' | 'message' | 'type'>> = {}
) =>
  showNotification({
    message,
    type: 'warning',
    duration: 6000,
    variant: 'outlined',
    ...options
  });

export const showInfo = (
  message: string,
  options: Partial<Omit<Notification, 'id' | 'message' | 'type'>> = {}
) =>
  showNotification({
    message,
    type: 'info',
    duration: 5000,
    variant: 'standard',
    ...options
  });

// Specialized notifications for common scenarios
export const showNetworkError = (message = 'Erro de conexão. Verifique sua internet.') =>
  showError(message, {
    title: 'Sem conexão',
    action: { label: 'Tentar novamente', onClick: () => window.location.reload() },
    position: 'top-center',
    persistent: true,
  });

export const showServerError = (message = 'Erro interno do servidor. Tente novamente.') =>
  showError(message, {
    title: 'Erro do servidor',
    duration: 10000,
    position: 'bottom-center',
  });

export const showValidationError = (message: string, field?: string) =>
  showWarning(message, {
    title: field ? `Erro em ${field}` : 'Dados inválidos',
    duration: 7000,
    position: 'top-right',
  });

export const showAuthError = (message = 'Sua sessão expirou. Faça login novamente.') =>
  showError(message, {
    title: 'Sessão expirada',
    action: { label: 'Fazer login', onClick: () => window.location.href = '/login' },
    persistent: true,
    position: 'top-center',
  });

export const showSuccessWithAction = (
  message: string,
  actionLabel: string,
  onAction: () => void
) =>
  showSuccess(message, {
    action: { label: actionLabel, onClick: onAction },
    duration: 6000,
  });

export default notificationSlice.reducer;
