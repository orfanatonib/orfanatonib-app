import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { REJECTION_MESSAGES, REJECTION_REASON_MAX_LENGTH, TOUCH_TARGET_PX } from '../constants';
import { rejectImageSection } from '../api';
import { extractErrorMessage } from '@/utils/apiError';

interface RejectImageSectionDialogProps {
  open: boolean;
  sectionId: string | null;
  caption: string;
  onClose: () => void;
  /** Chamado depois que a API confirmou a reprovação. */
  onRejected: () => void;
}

/** Diálogo de reprovação: o motivo é obrigatório e vai para o autor. */
export function RejectImageSectionDialog({
  open,
  sectionId,
  caption,
  onClose,
  onRejected,
}: RejectImageSectionDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const empty = reason.trim().length === 0;
  const close = () => {
    if (saving) return;
    setReason('');
    setTouched(false);
    setError('');
    onClose();
  };

  const confirm = async () => {
    setTouched(true);
    if (empty || !sectionId || saving) return;
    setSaving(true);
    setError('');
    try {
      await rejectImageSection(sectionId, reason.trim());
      setReason('');
      setTouched(false);
      onRejected();
    } catch (failure: unknown) {
      setError(extractErrorMessage(failure, REJECTION_MESSAGES.FAILED));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      aria-labelledby="reject-image-section-title"
      data-testid="reject-image-section-dialog"
    >
      <DialogTitle id="reject-image-section-title">Reprovar publicação</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          “{caption}” não será publicada. Quem enviou recebe o motivo na área do membro e por e-mail.
        </DialogContentText>
        <TextField
          autoFocus
          required
          fullWidth
          multiline
          minRows={3}
          label="Motivo da reprovação"
          value={reason}
          disabled={saving}
          onChange={(event) => setReason(event.target.value)}
          error={touched && empty}
          helperText={
            touched && empty
              ? REJECTION_MESSAGES.REASON_REQUIRED
              : `${reason.length}/${REJECTION_REASON_MAX_LENGTH}`
          }
          inputProps={{
            maxLength: REJECTION_REASON_MAX_LENGTH,
            'data-testid': 'reject-image-section-reason',
          }}
        />
        {error && (
          <Alert data-testid="reject-image-section-error" severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1, p: 2 }}>
        <Button
          data-testid="reject-image-section-cancel"
          onClick={close}
          disabled={saving}
          sx={{ minHeight: TOUCH_TARGET_PX, width: { xs: '100%', sm: 'auto' } }}
        >
          Cancelar
        </Button>
        <Button
          data-testid="reject-image-section-confirm"
          variant="contained"
          color="error"
          onClick={() => void confirm()}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ minHeight: TOUCH_TARGET_PX, width: { xs: '100%', sm: 'auto' } }}
        >
          Reprovar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
