import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from 'store/slices';
import { fetchRoutes } from 'store/slices/route/routeSlice';
import type { InformativeBannerData } from 'store/slices/informative/informativeBannerSlice';
import { createBannerApi, updateBannerApi } from '../api';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

interface InformativeBannerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  initialData?: InformativeBannerData | null;
}

export default function InformativeBannerModal({
  open,
  onClose,
  onSave,
  initialData,
}: InformativeBannerModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string>('');

  const isEditing = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setIsPublic(initialData.public);
    } else {
      setTitle('');
      setDescription('');
      setIsPublic(true);
    }
    setErrMsg('');
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setErrMsg('Preencha título e descrição.');
      return;
    }

    setLoading(true);
    setErrMsg('');
    try {
      const payload = { title: title.trim(), description: description.trim(), public: isPublic };

      if (isEditing && initialData?.id) {
        await updateBannerApi(initialData.id, payload);
      } else {
        await createBannerApi(payload);
      }

      await dispatch(fetchRoutes());
      await onSave();

      onClose();
    } catch (err: unknown) {
      const msg =
        getApiErrorMessage(err, 'Erro ao salvar banner. Tente novamente.');
      setErrMsg(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog data-testid="informatives-form-dialog" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Editar Banner Informativo' : 'Criar Banner Informativo'}</DialogTitle>
      <DialogContent>
        <Box mt={1}>
          {errMsg && (
            <Alert data-testid="informatives-form-error" severity="error" sx={{ mb: 2 }}>
              {errMsg}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Título"
            inputProps={{ 'data-testid': 'informatives-form-title' }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Descrição"
            inputProps={{ 'data-testid': 'informatives-form-description' }}
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                color="primary"
                inputProps={{ 'data-testid': 'informatives-form-public' } as React.InputHTMLAttributes<HTMLInputElement>}
                disabled={loading}
              />
            }
            label="Público"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button data-testid="informatives-form-cancel" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button data-testid="informatives-form-submit" variant="contained" onClick={handleSubmit} disabled={loading}>
          {isEditing ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
