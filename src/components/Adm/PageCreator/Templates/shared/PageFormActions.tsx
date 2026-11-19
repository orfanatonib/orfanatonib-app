import { Box, Button, CircularProgress } from '@mui/material';
import { Save } from '@mui/icons-material';
import { CANCEL_LABEL, PAGE_FORM_TEST_IDS } from './constants';
import { PAGE_ACTION_BUTTON_SX } from './styles';
import type { PageFormActionsProps } from './types';

/** Barra de ações: cancelar, ações extras e salvar com estado de envio. */
export default function PageFormActions({
  testId,
  cancelLabel = CANCEL_LABEL,
  saveLabel,
  savingLabel,
  isSaving,
  saveDisabled = false,
  saveColor = 'success',
  showSaveIcon = true,
  savingSpinner = false,
  onCancel,
  onSave,
  children,
}: PageFormActionsProps) {
  const startIcon = savingSpinner && isSaving
    ? <CircularProgress size={20} color="inherit" />
    : showSaveIcon
      ? <Save />
      : undefined;

  return (
    <Box
      data-testid={`${testId}-${PAGE_FORM_TEST_IDS.ACTIONS}`}
      sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}
    >
      <Button
        data-testid={`${testId}-${PAGE_FORM_TEST_IDS.CANCEL}`}
        variant="outlined"
        size="large"
        onClick={onCancel}
        sx={{
          ...PAGE_ACTION_BUTTON_SX,
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            transform: 'translateY(-2px)',
            boxShadow: 2,
            bgcolor: 'action.hover',
          },
        }}
      >
        {cancelLabel}
      </Button>
      {children}
      <Button
        data-testid={`${testId}-${PAGE_FORM_TEST_IDS.SAVE}`}
        variant="contained"
        color={saveColor}
        size="large"
        startIcon={startIcon}
        onClick={onSave}
        disabled={isSaving || saveDisabled}
        sx={{
          ...PAGE_ACTION_BUTTON_SX,
          '&:hover:not(:disabled)': { transform: 'translateY(-2px)', boxShadow: 4 },
          '&:disabled': { opacity: 0.6 },
        }}
      >
        {isSaving ? savingLabel : saveLabel}
      </Button>
    </Box>
  );
}
