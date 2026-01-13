import { memo } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
} from '@mui/material';

import type { AttendanceFormState } from '../types';

interface AttendanceSubmitSectionProps {
  formState: AttendanceFormState;
  hasExistingAttendance: boolean;
  isDisabled: boolean;
  disabledReason?: string;
  onSubmit: () => void;
  onClearError: () => void;
  onClearFeedback: () => void;
  isMobile?: boolean;
}

const AttendanceSubmitSection = memo(({
  formState,
  hasExistingAttendance,
  isDisabled,
  disabledReason,
  onSubmit,
  onClearError,
  onClearFeedback,
  isMobile = false,
}: AttendanceSubmitSectionProps) => {
  const buttonLabel = formState.loading
    ? hasExistingAttendance
      ? 'Atualizando...'
      : 'Registrando...'
    : hasExistingAttendance
      ? 'Atualizar Pagela'
      : 'Salvar Pagela';

  const content = (
    <Stack spacing={2}>
      {formState.error && (
        <Alert
          severity="error"
          onClose={onClearError}
          sx={{ mb: 0 }}
        >
          {formState.error}
        </Alert>
      )}

      {formState.feedback && (
        <Alert
          severity={formState.feedback.status}
          onClose={onClearFeedback}
          sx={{ mb: 0 }}
        >
          {formState.feedback.message}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={onSubmit}
        disabled={isDisabled}
        startIcon={formState.loading ? <CircularProgress size={20} color="inherit" /> : null}
        fullWidth
        sx={{
          py: 1.5,
          fontWeight: 'bold',
          fontSize: '1rem',
        }}
        title={disabledReason}
      >
        {buttonLabel}
      </Button>
    </Stack>
  );

  if (isMobile) {
    return (
      <Card variant="outlined" sx={{ bgcolor: 'primary.50', borderColor: 'primary.main' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ bgcolor: 'primary.50', borderColor: 'primary.main' }}>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
});

AttendanceSubmitSection.displayName = 'AttendanceSubmitSection';

export default AttendanceSubmitSection;
