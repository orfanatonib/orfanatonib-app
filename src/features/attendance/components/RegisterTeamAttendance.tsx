import { useEffect, useMemo, useState, memo, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MenuItem from '@mui/material/MenuItem';
import { registerTeamAttendance } from '../api';
import type {
  RegisterTeamAttendanceDto,
  AttendanceType,
  TeamMemberDto,
  TeamScheduleDto,
  AttendanceFormState,
  ValidationResult
} from '../types';
import { AttendanceType as AttendanceTypeEnum } from '../types';
import {
  validateScheduleDates,
  validateAttendanceComment,
  formatScheduleLabel,
  ATTENDANCE_RULES
} from '../utils';

interface Props {
  teamId: string;
  schedules: TeamScheduleDto[];
  members: TeamMemberDto[];
  disabled?: boolean;
}

interface AttendanceRow {
  memberId: string;
  name?: string;
  type: AttendanceType;
  comment: string;
}

// Função auxiliar removida - usando formatScheduleLabel do types.ts

const RegisterTeamAttendance = ({ teamId, schedules, members, disabled }: Props) => {
  const [scheduleId, setScheduleId] = useState<string>(schedules[0]?.id || '');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [formState, setFormState] = useState<AttendanceFormState>({
    loading: false,
    error: null,
    feedback: null,
  });

  const scheduleOptions = useMemo(
    () => schedules.map(s => ({ id: s.id, label: formatScheduleLabel(s) })),
    [schedules]
  );
  const memberOptions = useMemo(
    () => members.map(m => ({ id: m.id, label: `${m.name}${m.role ? ` • ${m.role}` : ''}${m.email ? ` • ${m.email}` : ''}` })),
    [members]
  );
  const selectedSchedule = useMemo(() => schedules.find(s => s.id === scheduleId), [schedules, scheduleId]);

  // Validações baseadas nas regras de negócio
  const scheduleValidation = useMemo((): ValidationResult => {
    if (!selectedSchedule) return { isValid: false, errors: ['Selecione um evento'] };
    return validateScheduleDates(selectedSchedule);
  }, [selectedSchedule]);

  // Validação dos comentários de todos os membros
  const rowsValidation = useMemo((): ValidationResult => {
    const errors: string[] = [];
    rows.forEach((row, index) => {
      const commentValidation = validateAttendanceComment(row.comment);
      if (!commentValidation.isValid) {
        errors.push(`Membro ${index + 1}: ${commentValidation.errors.join(', ')}`);
      }
    });
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [rows]);

  const isFormValid = useMemo(() => {
    return scheduleValidation.isValid &&
           rowsValidation.isValid &&
           rows.length > 0 &&
           !formState.loading &&
           !disabled;
  }, [scheduleValidation.isValid, rowsValidation.isValid, rows.length, formState.loading, disabled]);

  Doc:

  

  useEffect(() => {
    if (schedules.length > 0) {
      setScheduleId(prev => prev || schedules[0].id);
    }
  }, [schedules]);

  useEffect(() => {
    setRows(prev => {
      const prevMap = new Map(prev.map(r => [r.memberId, r]));
      if (members.length === 0) {
        return [];
      }

      return members.map(member => {
        const existing = prevMap.get(member.id);
        return existing
          ? { ...existing, name: member.name }
          : { memberId: member.id, name: member.name, type: AttendanceTypeEnum.PRESENT, comment: '' };
      });
    });
  }, [members]);

  const handleRowChange = (idx: number, field: keyof AttendanceRow, value: string | AttendanceType) => {
    setRows(prev => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const bulkSetType = (type: AttendanceTypeEnum) => {
    setRows(prev => prev.map(row => ({ ...row, type })));
  };

  const clearComments = () => {
    setRows(prev => prev.map(row => ({ ...row, comment: '' })));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações finais antes do envio
    if (!scheduleId) {
      setFormState(prev => ({
        ...prev,
        error: 'Selecione um evento para registrar a pagela.',
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

    const sanitized = rows.filter(r => r.memberId.trim() !== '');
    if (!sanitized.length) {
      setFormState(prev => ({
        ...prev,
        error: 'Adicione pelo menos um membro para registrar a pagela.',
        feedback: null,
      }));
      return;
    }

    if (!rowsValidation.isValid) {
      setFormState(prev => ({
        ...prev,
        error: rowsValidation.errors.join('; '),
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
      const dto: RegisterTeamAttendanceDto = {
        teamId,
        scheduleId,
        attendances: sanitized.map(r => ({
          memberId: r.memberId,
          type: r.type,
          comment: r.comment.trim() || undefined,
        })),
      };

      await registerTeamAttendance(dto);

      setFormState(prev => ({
        ...prev,
        loading: false,
        feedback: {
          status: 'success',
          message: `Pagela registrada com sucesso para ${sanitized.length} membro${sanitized.length > 1 ? 's' : ''}!`,
        },
      }));
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar pagela. Verifique os dados e tente novamente.';
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [teamId, scheduleId, scheduleValidation.isValid, rowsValidation.isValid, rows, registerTeamAttendance]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Registrar presença do time
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Líderes e admins registram presença/falta para todos os membros do time.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Time selecionado"
                value={teamId ? 'Time do painel' : 'Selecione um time acima'}
                disabled
                size="small"
              />

              <TextField
                select
                label="Evento do time"
                value={scheduleId}
                onChange={e => setScheduleId(e.target.value)}
                required
                size="small"
                disabled={disabled || scheduleOptions.length === 0}
                error={!scheduleValidation.isValid}
                helperText={
                  !scheduleValidation.isValid
                    ? scheduleValidation.errors.join(', ')
                    : 'Escolha a reunião/visita para registrar a pagela.'
                }
                aria-describedby="team-schedule-helper-text"
                inputProps={{
                  'aria-label': 'Selecionar evento para pagela do time',
                }}
              >
                {scheduleOptions.map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Marcar todos como presentes">
                  <IconButton
                    onClick={() => bulkSetType(AttendanceTypeEnum.PRESENT)}
                    size="small"
                    aria-label="Marcar todos os membros como presentes"
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Marcar todos como falta">
                  <IconButton
                    onClick={() => bulkSetType(AttendanceTypeEnum.ABSENT)}
                    size="small"
                    aria-label="Marcar todos os membros como falta"
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Limpar comentários">
                  <IconButton
                    onClick={clearComments}
                    size="small"
                    aria-label="Limpar todos os comentários"
                  >
                    <ClearAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  A lista é preenchida automaticamente com o time selecionado.
                </Typography>
              </Stack>

              <Stack spacing={1.5}>
                {rows.map((row, idx) => (
                  <Box
                    key={`${row.memberId}-${idx}`}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5,
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
                        <TextField
                          select
                          label="Membro"
                          value={row.memberId}
                          onChange={e => handleRowChange(idx, 'memberId', e.target.value)}
                          size="small"
                          required
                          disabled={disabled || memberOptions.length === 0}
                          fullWidth
                        >
                          {memberOptions.map(option => (
                            <MenuItem key={option.id} value={option.id}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <ToggleButtonGroup
                          value={row.type}
                          exclusive
                          onChange={(_, value) => value && handleRowChange(idx, 'type', value)}
                          size="small"
                          color="primary"
                          aria-label={`Selecionar presença para ${row.name || `membro ${idx + 1}`}`}
                          role="radiogroup"
                        >
                          <ToggleButton
                            value="present"
                            aria-label={`${row.name || `Membro ${idx + 1}`} - Presente`}
                          >
                            Presente
                          </ToggleButton>
                          <ToggleButton
                            value="absent"
                            aria-label={`${row.name || `Membro ${idx + 1}`} - Falta`}
                          >
                            Falta
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Stack>

                      <TextField
                        label="Comentário"
                        placeholder="Opcional - motivo da falta, observações"
                        value={row.comment}
                        onChange={e => handleRowChange(idx, 'comment', e.target.value)}
                        size="small"
                        multiline
                        minRows={2}
                        disabled={disabled}
                        error={!validateAttendanceComment(row.comment).isValid}
                        helperText={
                          !validateAttendanceComment(row.comment).isValid
                            ? validateAttendanceComment(row.comment).errors.join(', ')
                            : row.comment.length > 0 ? `${row.comment.length}/${ATTENDANCE_RULES.MAX_COMMENT_LENGTH}` : undefined
                        }
                        inputProps={{
                          maxLength: ATTENDANCE_RULES.MAX_COMMENT_LENGTH,
                          'aria-label': `Comentário para ${row.name || `membro ${idx + 1}`}`,
                        }}
                      />
                    </Stack>
                  </Box>
                ))}

                {rows.length === 0 && (
                  <Alert severity="info">Nenhum membro encontrado para este time.</Alert>
                )}
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isFormValid || !teamId || !scheduleId}
                  startIcon={formState.loading ? <CircularProgress size={16} color="inherit" /> : null}
                  aria-label={
                    formState.loading
                      ? 'Enviando pagela do time'
                      : `Salvar pagela para ${rows.length} membro${rows.length !== 1 ? 's' : ''}`
                  }
                >
                  {formState.loading ? 'Enviando...' : 'Salvar Pagela'}
                </Button>
                <Divider orientation="vertical" flexItem />
                <Typography variant="caption" color="text.secondary">
                  Apenas líder/admin do time pode enviar.
                </Typography>
              </Stack>
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

RegisterTeamAttendance.displayName = 'RegisterTeamAttendance';

export default memo(RegisterTeamAttendance);
