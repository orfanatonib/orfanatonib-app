import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert, Stack, Button, Typography, Box, IconButton } from '@mui/material';
import { Close as CloseIcon, CheckCircle, Error, Warning, Info } from '@mui/icons-material';
import type { RootState } from '@/store/slices';
import { hideNotification, NotificationPosition } from '@/store/slices/notification/notificationSlice';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return Error;
    case 'warning':
      return Warning;
    case 'info':
      return Info;
    default:
      return Info;
  }
};

const getPositionStyles = (position: NotificationPosition) => {
  const positions = {
    'top-left': { top: 24, left: 24 },
    'top-center': { top: 24, left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: 24, right: 24 },
    'bottom-left': { bottom: 24, left: 24 },
    'bottom-center': { bottom: 24, left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: 24, right: 24 },
  };
  return positions[position];
};

export default function GlobalNotification() {
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state: RootState) => state.notification.notifications
  );

  const handleClose = (id: string) => {
    dispatch(hideNotification(id));
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const position = notification.position || 'bottom-center';
    if (!acc[position]) acc[position] = [];
    acc[position].push(notification);
    return acc;
  }, {} as Record<NotificationPosition, typeof notifications>);

  return (
    <>
      {Object.entries(groupedNotifications).map(([position, positionNotifications]) => (
        <Stack
          key={position}
          spacing={1}
          sx={{
            position: 'fixed',
            zIndex: 9999,
            maxWidth: '90vw',
            width: 'auto',
            minWidth: 300,
            ...getPositionStyles(position as NotificationPosition),
          }}
        >
          {positionNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);

            return (
              <Alert
                key={notification.id}
                severity={notification.type}
                variant={notification.variant || 'filled'}
                elevation={notification.elevation || 3}
                onClose={!notification.persistent ? () => handleClose(notification.id) : undefined}
                icon={notification.showIcon !== false ? <Icon /> : undefined}
                action={
                  <>
                    {notification.action && (
                      <Button
                        size="small"
                        onClick={notification.action.onClick}
                        sx={{ color: 'inherit', ml: 1 }}
                      >
                        {notification.action.label}
                      </Button>
                    )}
                    {!notification.persistent && (
                      <IconButton
                        size="small"
                        onClick={() => handleClose(notification.id)}
                        sx={{ color: 'inherit' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </>
                }
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  '& .MuiAlert-message': {
                    width: '100%',
                    fontWeight: 500,
                  },
                }}
              >
                <Box>
                  {notification.title && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    {notification.message}
                  </Typography>
                  {notification.description && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
                      {notification.description}
                    </Typography>
                  )}
                </Box>
              </Alert>
            );
          })}
        </Stack>
      ))}
    </>
  );
}
