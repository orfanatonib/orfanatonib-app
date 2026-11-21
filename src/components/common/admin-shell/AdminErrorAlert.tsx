import { Alert, Button } from '@mui/material';
import { ADMIN_LABELS, ADMIN_TOUCH_TARGET_PX } from './constants';
import type { AdminErrorAlertProps } from './types';

/** Alerta de erro padrão das listagens administrativas. */
export default function AdminErrorAlert({ testId, message, onClose, onRetry }: AdminErrorAlertProps) {
  return (
    <Alert
      data-testid={testId}
      severity="error"
      onClose={onClose}
      action={
        onRetry ? (
          <Button
            color="inherit"
            size="small"
            onClick={onRetry}
            sx={{ minHeight: ADMIN_TOUCH_TARGET_PX }}
          >
            {ADMIN_LABELS.RETRY}
          </Button>
        ) : undefined
      }
      sx={{ borderRadius: 3, fontSize: '1rem' }}
    >
      {message}
    </Alert>
  );
}
