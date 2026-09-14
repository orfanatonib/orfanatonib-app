import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  open: boolean;
  materialTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export default function SetCurrentMaterialConfirmDialog({
  open, materialTitle, onClose, onConfirm, loading = false,
}: Props) {
  return (
    <Dialog
      data-testid="visit-material-set-current-dialog"
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ pr: 6 }}>
        Confirmar alteração
        <IconButton
          aria-label="fechar"
          onClick={onClose}
          disabled={loading}
          data-testid="visit-material-set-current-close"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Deseja realmente tornar <strong>{materialTitle}</strong> o material atual de visita?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          data-testid="visit-material-set-current-confirm"
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? 'Confirmando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
