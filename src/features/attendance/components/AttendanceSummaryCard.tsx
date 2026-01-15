import { memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

interface AttendanceSummaryCardProps {
  totalCount: number;
  presentCount: number;
  absentCount: number;
  isMobile?: boolean;
}

const AttendanceSummaryCard = memo(({
  totalCount,
  presentCount,
  absentCount,
  isMobile = false,
}: AttendanceSummaryCardProps) => {
  if (isMobile) {
    return (
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1, display: 'block' }}>
            Resumo
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>Total:</Typography>
              <Chip label={totalCount} size="small" color="default" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 'bold' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="success.main" sx={{ fontSize: '0.75rem' }}>Presentes:</Typography>
              <Chip
                label={presentCount}
                size="small"
                color="success"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 'bold' }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="error.main" sx={{ fontSize: '0.75rem' }}>Faltas:</Typography>
              <Chip
                label={absentCount}
                size="small"
                color="error"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 'bold' }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
            Resumo
          </Typography>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Total:</Typography>
              <Chip label={totalCount} size="small" color="default" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="success.main">Presentes:</Typography>
              <Chip label={presentCount} size="small" color="success" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="error.main">Faltas:</Typography>
              <Chip label={absentCount} size="small" color="error" />
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});

AttendanceSummaryCard.displayName = 'AttendanceSummaryCard';

export default AttendanceSummaryCard;
