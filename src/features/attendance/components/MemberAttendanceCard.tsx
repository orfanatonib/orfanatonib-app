import { memo } from 'react';
import {
  Box,
  Button,
  Collapse,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';

import { AttendanceType } from '../types';
import type { TeamMemberDto } from '../types';

interface MemberAttendanceCardProps {
  member: TeamMemberDto;
  attendance: { type: AttendanceType; comment: string };
  onTypeChange: (type: AttendanceType) => void;
  onCommentChange: (comment: string) => void;
  disabled?: boolean;
}

const MemberAttendanceCard = memo(({
  member,
  attendance,
  onTypeChange,
  onCommentChange,
  disabled
}: MemberAttendanceCardProps) => {
  const showComment = attendance.type === AttendanceType.ABSENT;
  const isPresent = attendance.type === AttendanceType.PRESENT;

  return (
    <Box sx={{ transition: 'all 0.2s ease-in-out' }}>
      <Stack spacing={0}>
        <Box sx={{ p: { xs: 0.75, sm: 1.5 } }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 1, sm: 2 }}
          >
            <Box
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: 1,
                bgcolor: isPresent
                  ? 'success.main'
                  : attendance.type === AttendanceType.ABSENT
                    ? 'error.main'
                    : 'grey.300',
                color: isPresent || attendance.type === AttendanceType.ABSENT ? 'white' : 'grey.600',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  opacity: disabled ? 1 : 0.8,
                  transform: disabled ? 'none' : 'scale(1.05)',
                },
              }}
              onClick={() => !disabled && onTypeChange(isPresent ? AttendanceType.ABSENT : AttendanceType.PRESENT)}
            >
              {isPresent ? (
                <CheckCircleIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              ) : attendance.type === AttendanceType.ABSENT ? (
                <CancelIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              ) : (
                <PersonIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              )}
            </Box>

            <Box flex={1} minWidth={0} sx={{ overflow: 'hidden' }}>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                {member.name}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              sx={{ flexShrink: 0 }}
            >
              <Button
                size="small"
                variant={isPresent ? 'contained' : 'outlined'}
                color="success"
                onClick={() => !disabled && onTypeChange(AttendanceType.PRESENT)}
                disabled={disabled}
                sx={{
                  minWidth: { xs: 36, sm: 90 },
                  textTransform: 'none',
                  fontWeight: isPresent ? 'bold' : 'normal',
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  px: { xs: 0.75, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>✓ Presente</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>✓</Box>
              </Button>
              <Button
                size="small"
                variant={attendance.type === AttendanceType.ABSENT ? 'contained' : 'outlined'}
                color="error"
                onClick={() => !disabled && onTypeChange(AttendanceType.ABSENT)}
                disabled={disabled}
                sx={{
                  minWidth: { xs: 36, sm: 80 },
                  textTransform: 'none',
                  fontWeight: attendance.type === AttendanceType.ABSENT ? 'bold' : 'normal',
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  px: { xs: 0.75, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>✕ Falta</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>✕</Box>
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Collapse in={showComment}>
          <Box
            sx={{
              px: { xs: 0.75, sm: 1.5 },
              pb: 1,
              pt: 0.75,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'error.50',
            }}
          >
            <TextField
              label="Motivo (opcional)"
              placeholder="Ex: Doente, viagem..."
              value={attendance.comment}
              onChange={e => onCommentChange(e.target.value)}
              size="small"
              multiline
              minRows={1}
              maxRows={3}
              disabled={disabled}
              fullWidth
              InputLabelProps={{ sx: { fontSize: { xs: '0.75rem', sm: '1rem' } } }}
              inputProps={{ sx: { fontSize: { xs: '0.8rem', sm: '1rem' } } }}
            />
          </Box>
        </Collapse>
      </Stack>
    </Box>
  );
});

MemberAttendanceCard.displayName = 'MemberAttendanceCard';

export default MemberAttendanceCard;
