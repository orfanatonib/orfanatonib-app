import { useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid2,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { FEATURE_FLAG_AUDIENCE_OPTIONS } from '../constants';
import type {
  FeatureFlagFormErrors,
  FeatureFlagFormValues,
  FeatureFlagResponse,
} from '../types';
import {
  audienceInfo,
  hasFeatureFlagFormErrors,
  isFeatureFlagKeyUsedByApp,
  toFeatureFlagFormValues,
  validateFeatureFlagForm,
} from '../utils/featureFlagUtils';

interface FeatureFlagFormDialogProps {
  open: boolean;
  flag: FeatureFlagResponse | null;
  saving: boolean;
  error: string;
  onDismissError: () => void;
  onClose: () => void;
  onSubmit: (values: FeatureFlagFormValues) => Promise<boolean>;
}

const NO_ERRORS: FeatureFlagFormErrors = {
  key: false,
  name: false,
  metadataJson: false,
};

export function FeatureFlagFormDialog({
  open,
  flag,
  saving,
  error,
  onDismissError,
  onClose,
  onSubmit,
}: FeatureFlagFormDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [values, setValues] = useState(() => toFeatureFlagFormValues(flag));
  const [errors, setErrors] = useState<FeatureFlagFormErrors>(NO_ERRORS);
  const dismissError = useRef(onDismissError);

  useEffect(() => {
    dismissError.current = onDismissError;
  });

  useEffect(() => {
    if (!open) return;
    setValues(toFeatureFlagFormValues(flag));
    setErrors(NO_ERRORS);
    dismissError.current();
  }, [open, flag]);

  const setValue = <Key extends keyof FeatureFlagFormValues>(
    key: Key,
    value: FeatureFlagFormValues[Key],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    const nextErrors = validateFeatureFlagForm(values);
    setErrors(nextErrors);
    if (hasFeatureFlagFormErrors(nextErrors)) return;
    if (await onSubmit(values)) onClose();
  };

  const selectedAudience = audienceInfo(values.audience);
  const renamingUsedKey = Boolean(
    flag &&
      flag.key !== values.key &&
      isFeatureFlagKeyUsedByApp(flag.key),
  );

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      data-testid="feature-flags-form-dialog"
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          fontWeight: 700,
        }}
      >
        {flag ? 'Editar feature flag' : 'Nova feature flag'}
        <IconButton
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Fechar"
          data-testid="feature-flags-form-close"
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error ? (
          <Alert
            severity="error"
            onClose={onDismissError}
            data-testid="feature-flags-form-error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        ) : null}

        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Chave"
              value={values.key}
              onChange={(event) =>
                setValue('key', event.target.value.toLowerCase())
              }
              disabled={saving}
              error={errors.key}
              helperText={
                errors.key
                  ? 'Use letras minúsculas, números, "_" ou "-".'
                  : 'É por esta chave que a aplicação consulta a flag.'
              }
              inputProps={{ 'data-testid': 'feature-flags-form-key' }}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nome"
              value={values.name}
              onChange={(event) => setValue('name', event.target.value)}
              disabled={saving}
              error={errors.name}
              helperText={errors.name ? 'Informe um nome.' : ' '}
              inputProps={{ 'data-testid': 'feature-flags-form-name' }}
            />
          </Grid2>

          <Grid2 size={12}>
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={2}
              value={values.description}
              onChange={(event) => setValue('description', event.target.value)}
              disabled={saving}
              inputProps={{ 'data-testid': 'feature-flags-form-description' }}
            />
          </Grid2>

          <Grid2 size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.enabled}
                  onChange={(event) => setValue('enabled', event.target.checked)}
                  disabled={saving}
                  inputProps={{ 'aria-label': 'Situação da feature flag' }}
                  data-testid="feature-flags-form-enabled"
                />
              }
              label={values.enabled ? 'Ligada' : 'Desligada'}
            />
          </Grid2>
        </Grid2>

        {renamingUsedKey ? (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Esta chave é consultada pela aplicação. Renomeá-la desliga o
            recurso até o código passar a usar a nova chave.
          </Alert>
        ) : null}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Quem enxerga a flag
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedAudience.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            {FEATURE_FLAG_AUDIENCE_OPTIONS.map((option) => {
              const selected = option.value === values.audience;
              return (
                <Chip
                  key={option.value}
                  label={option.label}
                  color={selected ? option.color : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  disabled={saving}
                  onClick={() => setValue('audience', option.value)}
                  data-testid={`feature-flags-form-audience-${option.value.toLowerCase()}`}
                  sx={{ height: { xs: 44, sm: 36 } }}
                />
              );
            })}
          </Stack>
        </Box>

        <TextField
          fullWidth
          label="Metadata (JSON)"
          multiline
          rows={3}
          value={values.metadataJson}
          onChange={(event) => setValue('metadataJson', event.target.value)}
          error={errors.metadataJson}
          helperText={
            errors.metadataJson
              ? 'Informe um objeto JSON válido, ou deixe vazio.'
              : 'Opcional. Ex.: {"rollout": 50}'
          }
          disabled={saving}
          inputProps={{ 'data-testid': 'feature-flags-form-metadata' }}
          sx={{ mt: 3 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          type="button"
          onClick={onClose}
          disabled={saving}
          fullWidth={isMobile}
          data-testid="feature-flags-form-cancel"
          sx={{ minHeight: 44 }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />
          }
          fullWidth={isMobile}
          data-testid="feature-flags-form-submit"
          sx={{ minHeight: 44 }}
        >
          {flag ? 'Salvar alterações' : 'Criar flag'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
