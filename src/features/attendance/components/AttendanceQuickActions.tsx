import { memo } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ClearAllIcon from '@mui/icons-material/ClearAll';

import { AttendanceType } from '../types';

interface AttendanceQuickActionsProps {
  onBulkSetType: (type: AttendanceType) => void;
  onClearComments: () => void;
  disabled?: boolean;
  isMobile?: boolean;
}

const AttendanceQuickActions = memo(({
  onBulkSetType,
  onClearComments,
  disabled = false,
  isMobile = false,
}: AttendanceQuickActionsProps) => {
  if (isMobile) {
    return (
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1, display: 'block' }}>
            Ações Rápidas
          </Typography>
          <Stack spacing={0.75}>
            <Button
              variant="outlined"
              color="success"
              size="small"
              fullWidth
              onClick={() => onBulkSetType(AttendanceType.PRESENT)}
              disabled={disabled}
              sx={{ fontSize: '0.7rem', py: 0.5, textTransform: 'none', minHeight: 28, fontWeight: 'medium' }}
            >
              ✓ Presentes
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              fullWidth
              onClick={() => onBulkSetType(AttendanceType.ABSENT)}
              disabled={disabled}
              sx={{ fontSize: '0.7rem', py: 0.5, textTransform: 'none', minHeight: 28, fontWeight: 'medium' }}
            >
              ✕ Faltas
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title="Ações Rápidas"
        titleTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
      />
      <CardContent>
        <Stack spacing={1.5}>
          <Button
            variant="outlined"
            color="success"
            size="small"
            fullWidth
            startIcon={<CheckCircleIcon />}
            onClick={() => onBulkSetType(AttendanceType.PRESENT)}
            disabled={disabled}
          >
            Todos Presentes
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            fullWidth
            startIcon={<CancelIcon />}
            onClick={() => onBulkSetType(AttendanceType.ABSENT)}
            disabled={disabled}
          >
            Todos Faltas
          </Button>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<ClearAllIcon />}
            onClick={onClearComments}
            disabled={disabled}
          >
            Limpar Comentários
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
});

AttendanceQuickActions.displayName = 'AttendanceQuickActions';

export default AttendanceQuickActions;
