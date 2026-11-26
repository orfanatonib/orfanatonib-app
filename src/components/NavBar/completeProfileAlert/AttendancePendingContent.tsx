import React from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { AttendanceType } from '@/features/attendance/types';
import type { PendingForMemberDto } from '@/features/attendance/types';
import { ATTENDANCE_SUCCESS_MESSAGES } from '@/constants/errors';
import { ALERT_TEXTS } from './constants';
import type { AttendancePendingForm } from './useAttendancePendingForm';
import { formatScheduleLabel, isSamePending } from './utils';

interface Props {
  form: AttendancePendingForm;
  pendings: PendingForMemberDto[];
  loading: boolean;
  isMobile: boolean;
}

const mobileListSx = {
  display: 'flex',
  overflowX: 'auto',
  gap: 1.5,
  pb: 1,
  mx: -2,
  px: 2,
  '&::-webkit-scrollbar': { display: 'none' },
  scrollbarWidth: 'none',
} as const;

const desktopListSx = { display: 'flex', flexDirection: 'column', gap: 1 } as const;

const AttendancePendingContent: React.FC<Props> = ({ form, pendings, loading, isMobile }) => {
  const { selectedId, selectedCategory, selectedPending, type, comment, error, feedback } = form;
  const hasPendings = pendings.length > 0;

  return (
    <Stack spacing={2} sx={{ mt: 2, pb: isMobile ? 2 : 0 }} data-testid="attendance-pending-content">
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }} data-testid="attendance-pending-loading">
          <CircularProgress />
        </Box>
      )}

      {!loading && !hasPendings && (
        <Alert severity="success" sx={{ borderRadius: 2 }} data-testid="attendance-pending-empty">
          {ATTENDANCE_SUCCESS_MESSAGES.NO_PENDINGS}
        </Alert>
      )}

      {!loading && hasPendings && (
        <Typography variant="body2" color="text.secondary">
          {ALERT_TEXTS.selectEvent}
        </Typography>
      )}

      {!loading && hasPendings && (
        <Box sx={isMobile ? mobileListSx : desktopListSx} data-testid="attendance-pending-list">
          {pendings.map((pending) => {
            const isSelected = isSamePending(pending, selectedId, selectedCategory);
            return (
              <Box
                key={`${pending.scheduleId}-${pending.category}`}
                data-testid="attendance-pending-item"
                onClick={() => form.select(pending)}
                sx={{
                  minWidth: isMobile ? '85%' : 'auto',
                  p: 2,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? 2 : 0,
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={isSelected ? 'bold' : 'medium'}
                  color={isSelected ? 'primary.main' : 'text.primary'}
                >
                  {formatScheduleLabel(pending)}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                  {pending.lessonContent}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip size="small" label={pending.teamName} sx={{ height: 20, fontSize: '0.7rem' }} />
                  <Chip
                    size="small"
                    label={pending.shelterName}
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      maxWidth: '100px',
                      '& .MuiChip-label': {
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        px: 1,
                      },
                    }}
                  />
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {selectedPending && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }} data-testid="attendance-pending-form">
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              {ALERT_TEXTS.registerTitle}
            </Typography>

            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, value: AttendanceType | null) => {
                if (value) form.setType(value);
              }}
              fullWidth
              size="large"
              color="primary"
              sx={{ '& .MuiToggleButton-root': { py: 1.5, textTransform: 'none', fontWeight: 600 } }}
            >
              <ToggleButton value={AttendanceType.PRESENT} data-testid="attendance-pending-present">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon />
                  {ALERT_TEXTS.present}
                </Box>
              </ToggleButton>
              <ToggleButton value={AttendanceType.ABSENT} data-testid="attendance-pending-absent">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon />
                  {ALERT_TEXTS.absent}
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            {type === AttendanceType.ABSENT && (
              <TextField
                label={ALERT_TEXTS.absenceReasonLabel}
                placeholder={ALERT_TEXTS.absenceReasonPlaceholder}
                value={comment}
                onChange={(e) => form.setComment(e.target.value)}
                size="medium"
                multiline
                minRows={2}
                fullWidth
                inputProps={{ 'data-testid': 'attendance-pending-reason' }}
              />
            )}
          </Stack>
        </Box>
      )}

      {error && <Alert severity="error" data-testid="attendance-pending-error">{error}</Alert>}
      {feedback && <Alert severity="success" data-testid="attendance-pending-success">{feedback}</Alert>}
    </Stack>
  );
};

export default AttendancePendingContent;
