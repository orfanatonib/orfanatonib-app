import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert, Stack } from '@mui/material';
import type { RootState } from '@/store/slices';
import { hideNotification } from '@/store/slices/notification/notificationSlice';

export default function GlobalNotification() {
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state: RootState) => state.notification.notifications
  );

  const handleClose = (id: string) => {
    dispatch(hideNotification(id));
  };

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '90vw',
        width: 'auto',
        minWidth: 300,
      }}
    >
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open
          autoHideDuration={notification.duration || 6000}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ position: 'relative', mb: 1 }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{
              width: '100%',
              boxShadow: 3,
              '& .MuiAlert-message': {
                fontWeight: 500,
              },
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
