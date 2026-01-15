import { memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import type { TeamScheduleDto } from '../types';
import { formatScheduleLabel } from '../utils';

import { EventCategory } from '../types';

type EventTypeFilter = EventCategory;

interface EventFilterSelectorProps {
  eventTypeFilter: EventTypeFilter;
  scheduleId: string;
  filteredSchedules: TeamScheduleDto[];
  existingRecordsScheduleId?: string;
  hasExistingAttendance: boolean;
  loadingSchedules: boolean;
  loadingExistingRecords: boolean;
  onEventTypeChange: (value: EventTypeFilter) => void;
  onScheduleChange: (scheduleId: string) => void;
  isMobile?: boolean;
}

const EventFilterSelector = memo(({
  eventTypeFilter,
  scheduleId,
  filteredSchedules,
  existingRecordsScheduleId,
  hasExistingAttendance,
  loadingSchedules,
  loadingExistingRecords,
  onEventTypeChange,
  onScheduleChange,
  isMobile = false,
}: EventFilterSelectorProps) => {
  const helperText = loadingSchedules
    ? 'Carregando...'
    : loadingExistingRecords
      ? isMobile ? 'Carregando...' : 'Carregando registros...'
      : hasExistingAttendance
        ? 'Frequência já lançada - editando'
        : isMobile ? '' : 'Selecione o evento';

  const content = (
    <>
      <Box sx={{ mb: isMobile ? 1.5 : 1, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={eventTypeFilter}
          exclusive
          onChange={(_, value) => value && onEventTypeChange(value)}
          size="small"
          aria-label="Filtro de eventos"
          fullWidth
        >
          <ToggleButton value="visit" sx={isMobile ? { py: 0.5, fontSize: '0.8rem' } : undefined}>
            Visitas
          </ToggleButton>
          <ToggleButton value="meeting" sx={isMobile ? { py: 0.5, fontSize: '0.8rem' } : undefined}>
            Reuniões
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ position: 'relative' }}>
        {loadingExistingRecords && (
          <CircularProgress
            size={isMobile ? 16 : 20}
            sx={{
              position: 'absolute',
              right: isMobile ? 10 : 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
          />
        )}
        <TextField
          select
          label="Evento"
          value={scheduleId}
          onChange={e => onScheduleChange(e.target.value)}
          required
          size="small"
          disabled={loadingSchedules || filteredSchedules.length === 0 || loadingExistingRecords}
          fullWidth
          helperText={helperText}
          FormHelperTextProps={isMobile ? { sx: { fontSize: '0.65rem', mt: 0.5 } } : undefined}
        >
          {filteredSchedules.length === 0 && (
            <MenuItem disabled value="">
              {isMobile ? 'Nenhum evento' : 'Nenhum evento encontrado'}
            </MenuItem>
          )}
          {filteredSchedules.map(schedule => {
            const scheduleHasRecords = existingRecordsScheduleId === schedule.id;
            return (
              <MenuItem key={schedule.id} value={schedule.id}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                  <Box
                    flex={1}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatScheduleLabel(schedule)}
                  </Box>
                  {scheduleHasRecords && (
                    <CheckCircleOutlineIcon fontSize="small" color="success" />
                  )}
                </Stack>
              </MenuItem>
            );
          })}
        </TextField>
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {content}
    </Box>
  );
});

EventFilterSelector.displayName = 'EventFilterSelector';

export default EventFilterSelector;
