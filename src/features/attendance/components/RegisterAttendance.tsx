import { useEffect, useMemo, useState, memo, useCallback } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import MenuItem from '@mui/material/MenuItem';

import { registerAttendance } from '../api';
import type {
  RegisterAttendanceDto,
  AttendanceType,
  TeamScheduleDto,
  AttendanceFormState,
  ValidationResult
} from '../types';
import {
  validateScheduleDates,
  validateAttendanceComment,
  formatScheduleLabel,
  formatDateBR
} from '../utils';

// Função auxiliar para formatação de datas
const formatDateBR = (iso?: string) => {
  if (!iso) return 'Data a definir';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

interface Props {
  schedules: TeamScheduleDto[];
  disabled?: boolean;
}

const RegisterAttendance = ({ schedules, disabled }: Props) => {
  const [scheduleId, setScheduleId] = useState<string>(schedules[0]?.id || '');
  const [type, setType] = useState<AttendanceType>('present');
  const [comment, setComment] = useState('');
  const [formState, setFormState] = useState<AttendanceFormState>({
    loading: false,
    error: null,
    feedback: null,
  });

  const selectedSchedule = useMemo(
    () => schedules.find(s => s.id === scheduleId),
    [schedules, scheduleId]
  );

  // Validações baseadas nas regras de negócio
  const scheduleValidation = useMemo((): ValidationResult => {
    if (!selectedSchedule) return { isValid: false, errors: ['Selecione um evento'] };
    return validateScheduleDates(selectedSchedule);
  }, [selectedSchedule]);

  const commentValidation = useMemo((): ValidationResult => {
    return validateAttendanceComment(comment);
  }, [comment]);

  const isFormValid = useMemo(() => {
    return scheduleValidation.isValid && commentValidation.isValid && !formState.loading && !disabled;
  }, [scheduleValidation.isValid, commentValidation.isValid, formState.loading, disabled]);

  useEffect(() => {
    if (schedules.length > 0) setScheduleId(schedules[0].id);
    else setScheduleId('');
  }, [schedules]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações finais antes do envio
    if (!scheduleId) {
      setFormState(prev => ({
        ...prev,
        error: 'Selecione um evento para registrar a presença.',
        feedback: null,
      }));
      return;
    }

    if (!scheduleValidation.isValid) {
      setFormState(prev => ({
        ...prev,
        error: scheduleValidation.errors.join(', '),
        feedback: null,
      }));
      return;
    }

    if (!commentValidation.isValid) {
      setFormState(prev => ({
        ...prev,
        error: commentValidation.errors.join(', '),
        feedback: null,
      }));
      return;
    }

    setFormState(prev => ({
      ...prev,
      loading: true,
      error: null,
      feedback: null,
    }));

    try {
      const dto: RegisterAttendanceDto = {
        scheduleId,
        type,
        comment: comment.trim() || undefined,
      };

      await registerAttendance(dto);

      setFormState(prev => ({
        ...prev,
        loading: false,
        feedback: {
          status: 'success',
          message: 'Presença registrada com sucesso! Se já existia um registro, foi atualizado.',
        },
      }));

      setComment('');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar presença. Tente novamente.';
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [scheduleId, scheduleValidation.isValid, commentValidation.isValid, type, comment, registerAttendance]);

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'grid',
              placeItems: 'center',
            }}
            aria-hidden="true"
          >
            <PersonPinCircleIcon />
          </Box>
        }
        title="Minha presença"
        subheader="Escolha o evento e marque Presente ou Falta."
      />

      <CardContent>
        <Stack spacing={2}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                select
                label="Evento do time"
                value={scheduleId}
                onChange={e => setScheduleId(e.target.value)}
                required
                size="small"
                disabled={disabled || schedules.length === 0}
                error={!scheduleValidation.isValid}
                helperText={
                  schedules.length === 0
                    ? 'Nenhum evento retornado para este time.'
                    : !scheduleValidation.isValid
                    ? scheduleValidation.errors.join(', ')
                    : 'Escolha o evento onde você participou ou faltou.'
                }
                aria-describedby="schedule-helper-text"
                inputProps={{
                  'aria-label': 'Selecionar evento do time',
                }}
              >
                {schedules.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {formatScheduleLabel(s)}
                  </MenuItem>
                ))}
              </TextField>

              {selectedSchedule && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip size="small" label={scheduleKind(selectedSchedule)} />
                    <Chip size="small" label={`#${selectedSchedule.visitNumber}`} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateBR(selectedSchedule.visitDate || selectedSchedule.meetingDate)}
                    </Typography>
                  </Stack>

                  {selectedSchedule.lessonContent && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <b>Lição:</b> {selectedSchedule.lessonContent}
                    </Typography>
                  )}

                  {(selectedSchedule.meetingRoom || selectedSchedule.observation) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {selectedSchedule.meetingRoom ? `Sala: ${selectedSchedule.meetingRoom}` : ''}
                      {selectedSchedule.meetingRoom && selectedSchedule.observation ? ' • ' : ''}
                      {selectedSchedule.observation ? `Obs.: ${selectedSchedule.observation}` : ''}
                    </Typography>
                  )}
                </Box>
              )}

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Situação
                </Typography>
                <ToggleButtonGroup
                  value={type}
                  exclusive
                  onChange={(_, value) => value && setType(value)}
                  size="small"
                  color="primary"
                  aria-label="Selecionar tipo de presença"
                  role="radiogroup"
                >
                  <ToggleButton
                    value="present"
                    aria-label="Marcar como presente"
                  >
                    Presente
                  </ToggleButton>
                  <ToggleButton
                    value="absent"
                    aria-label="Marcar como falta"
                  >
                    Falta
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <TextField
                label="Comentário (opcional)"
                placeholder="Ex.: Cheguei 10 minutos antes / estava doente"
                value={comment}
                onChange={e => setComment(e.target.value)}
                size="small"
                multiline
                minRows={2}
                disabled={disabled}
                error={!commentValidation.isValid}
                helperText={
                  !commentValidation.isValid
                    ? commentValidation.errors.join(', ')
                    : `${comment.length}/500 caracteres`
                }
                inputProps={{
                  maxLength: 500,
                  'aria-label': 'Comentário opcional sobre presença',
                  'aria-describedby': 'comment-helper-text'
                }}
                aria-describedby="comment-helper-text"
              />

              <Divider />

              <Button
                type="submit"
                variant="contained"
                disabled={!isFormValid || !scheduleId}
                startIcon={formState.loading ? <CircularProgress size={16} color="inherit" /> : null}
                aria-label={formState.loading ? 'Enviando registro de presença' : 'Registrar presença no evento selecionado'}
              >
                {formState.loading ? 'Enviando...' : 'Registrar Presença'}
              </Button>
            </Stack>
          </form>

          {formState.error && (
            <Alert severity="error" onClose={() => setFormState(prev => ({ ...prev, error: null }))}>
              {formState.error}
            </Alert>
          )}

          {formState.feedback && (
            <Alert
              severity={formState.feedback.status}
              onClose={() => setFormState(prev => ({ ...prev, feedback: null }))}
            >
              {formState.feedback.message}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

RegisterAttendance.displayName = 'RegisterAttendance';

export default memo(RegisterAttendance);
