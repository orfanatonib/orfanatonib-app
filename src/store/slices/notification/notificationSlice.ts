import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
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
        ...action.payload,
      });
    },
    hideNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { showNotification, hideNotification, clearAllNotifications } =
  notificationSlice.actions;

export const showError = (message: string, duration = 6000) =>
  showNotification({ message, type: 'error', duration });

export const showSuccess = (message: string, duration = 4000) =>
  showNotification({ message, type: 'success', duration });

export const showWarning = (message: string, duration = 5000) =>
  showNotification({ message, type: 'warning', duration });

export const showInfo = (message: string, duration = 4000) =>
  showNotification({ message, type: 'info', duration });

export default notificationSlice.reducer;
