import { Alert, Snackbar } from '@mui/material';
import { SNACKBAR_AUTO_HIDE_MS } from './constants';
import type { PageFeedbackSnackbarProps } from './types';

/** Aviso de sucesso/erro dos criadores de página. */
export default function PageFeedbackSnackbar({
  open,
  message,
  severity,
  onClose,
  testId,
  filled = false,
  showCloseButton = true,
}: PageFeedbackSnackbarProps) {
  return (
    <Snackbar
      data-testid={testId}
      open={open}
      autoHideDuration={SNACKBAR_AUTO_HIDE_MS}
      onClose={onClose}
      {...(filled ? { anchorOrigin: { vertical: 'bottom' as const, horizontal: 'center' as const } } : {})}
    >
      <Alert
        {...(showCloseButton ? { onClose } : {})}
        severity={severity}
        {...(filled ? { variant: 'filled' as const, sx: { width: '100%' } } : {})}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
