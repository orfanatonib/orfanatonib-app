import React from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AttendanceType } from '@/features/attendance/types';
import type { PendingForMemberDto } from '@/features/attendance/types';
import AttendancePendingContent from './AttendancePendingContent';
import { ALERT_TEXTS } from './constants';
import type { AttendancePendingForm } from './useAttendancePendingForm';

interface Props {
  form: AttendancePendingForm;
  pendings: PendingForMemberDto[];
  loading: boolean;
  isMobile: boolean;
}

/** Drawer inferior no celular, diálogo no desktop; ambos registram presença/falta pelo mesmo formulário. */
const PendingAttendanceDialog: React.FC<Props> = ({ form, pendings, loading, isMobile }) => {
  const isAbsent = form.type === AttendanceType.ABSENT;
  const submitDisabled = !form.selectedId || form.saving || loading || pendings.length === 0;
  const content = <AttendancePendingContent form={form} pendings={pendings} loading={loading} isMobile={isMobile} />;

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={form.dialogOpen}
        onClose={form.close}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85vh', p: 0 } }}
        data-testid="attendance-pending-drawer"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            {ALERT_TEXTS.pendingsDialogTitleMobile}
          </Typography>
          <IconButton onClick={form.close} size="small" sx={{ bgcolor: 'grey.100', minWidth: 44, minHeight: 44 }} aria-label="Fechar">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 2, overflowY: 'auto' }}>
          {content}
          <Button
            onClick={form.submit}
            variant="contained"
            fullWidth
            size="large"
            disabled={submitDisabled}
            sx={{ mt: 1, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
            color={isAbsent ? 'error' : 'primary'}
            data-testid="attendance-pending-submit"
          >
            {form.saving ? 'Confirmando...' : isAbsent ? 'Confirmar Falta' : 'Confirmar Presença'}
          </Button>
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={form.dialogOpen}
      onClose={form.closeAndReset}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
      data-testid="attendance-pending-dialog"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        {ALERT_TEXTS.pendingsTitle}
        <IconButton onClick={form.close} aria-label="Fechar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{content}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={form.close} color="inherit">
          {ALERT_TEXTS.cancel}
        </Button>
        <Button
          onClick={form.submit}
          variant="contained"
          disabled={submitDisabled}
          color={isAbsent ? 'error' : 'primary'}
          data-testid="attendance-pending-submit"
        >
          {form.saving ? 'Registrando...' : isAbsent ? 'Registrar Falta' : 'Registrar Presença'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingAttendanceDialog;
