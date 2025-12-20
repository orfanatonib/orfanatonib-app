import {
  Box,
  TextField,
  Stack,
  Divider,
  Typography,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  DayItem,
  WeekDay,
  WeekDayLabel,
} from '@/store/slices/meditation/meditationSlice';
import { Visibility, Edit, Delete } from '@mui/icons-material';

interface Props {
  days: DayItem[];
  onDaysChange: (value: DayItem[]) => void;
}

const weekDays: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function isValidWeekDay(day: string): day is WeekDay {
  return weekDays.includes(day as WeekDay);
}

export default function MeditationForm({ days, onDaysChange }: Props) {
  const [selectedDay, setSelectedDay] = useState<WeekDay>('Monday');
  const [verse, setVerse] = useState('');
  const [topic, setTopic] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [previewDay, setPreviewDay] = useState<DayItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [touched, setTouched] = useState({ topic: false, verse: false });

  const availableWeekDays = weekDays.filter(
    (day) => !days.some((d) => d.day === day) || days[editIndex || -1]?.day === day
  );

  useEffect(() => {
    if (editIndex !== null) {
      const item = days[editIndex];
      if (item) {
        setSelectedDay(item.day as WeekDay);
        setVerse(item.verse);
        setTopic(item.topic);
      }
    }
  }, [editIndex, days]);

  const handleSaveDay = () => {
    setTouched({ topic: true, verse: true });
    
    if (!verse.trim() || !topic.trim()) {
      setError('Preencha todos os campos do dia.');
      return;
    }

    const newDay: DayItem = {
      id: Date.now().toString(),
      day: selectedDay,
      verse: verse.trim(),
      topic: topic.trim(),
    };

    if (editIndex !== null) {
      const updated = [...days];
      updated[editIndex] = newDay;
      onDaysChange(updated);
    } else {
      if (days.find((d) => d.day === selectedDay)) {
        setError('Esse dia da semana já foi adicionado.');
        return;
      }
      onDaysChange([...days, newDay]);
    }

    setSelectedDay('Monday');
    setVerse('');
    setTopic('');
    setEditIndex(null);
    setError('');
    setTouched({ topic: false, verse: false });
  };

  return (
    <Box>
      {(days.length < 5 || editIndex !== null) && (
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            {editIndex !== null ? '✏️ Editar Dia' : '➕ Adicionar Dia da Semana'}
          </Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel id="day-select-label">Dia da Semana</InputLabel>
              <Select
                labelId="day-select-label"
                value={selectedDay}
                label="Dia da Semana"
                onChange={(e: SelectChangeEvent<WeekDay>) =>
                  setSelectedDay(e.target.value as WeekDay)
                }
                sx={{
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  },
                }}
              >
                {availableWeekDays.map((day) => (
                  <MenuItem key={day} value={day}>
                    {WeekDayLabel[day]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Tema *"
              required
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (touched.topic) setTouched((prev) => ({ ...prev, topic: false }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, topic: true }))}
              error={touched.topic && !topic.trim()}
              helperText={touched.topic && !topic.trim() ? 'Campo obrigatório' : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover:not(.Mui-error)': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                  },
                },
                '& .MuiFormHelperText-root': {
                  marginLeft: 0,
                  marginTop: 1,
                  fontSize: '0.75rem',
                },
              }}
            />

            <TextField
              fullWidth
              label="Versículo *"
              required
              multiline
              rows={3}
              value={verse}
              onChange={(e) => {
                setVerse(e.target.value);
                if (touched.verse) setTouched((prev) => ({ ...prev, verse: false }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, verse: true }))}
              error={touched.verse && !verse.trim()}
              helperText={touched.verse && !verse.trim() ? 'Campo obrigatório' : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover:not(.Mui-error)': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                    },
                  },
                },
                '& .MuiFormHelperText-root': {
                  marginLeft: 0,
                  marginTop: 1,
                  fontSize: '0.75rem',
                },
              }}
            />

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handleSaveDay}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {editIndex !== null ? 'Atualizar Dia' : 'Adicionar Dia'}
              </Button>
              {editIndex !== null && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditIndex(null);
                    setVerse('');
                    setTopic('');
                    setSelectedDay('Monday');
                    setError('');
                    setTouched({ topic: false, verse: false });
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  Cancelar Edição
                </Button>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {days.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            📅 Dias da Semana ({days.length}/5)
          </Typography>
          <Grid container spacing={3}>
            {days.map((day, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1, p: 2.5 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {isValidWeekDay(day.day) ? WeekDayLabel[day.day] : day.day}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Tópico:</strong> {day.topic}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      <strong>Versículo:</strong> {day.verse}
                    </Typography>
                  </CardContent>
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    gap={1}
                    p={1.5}
                    borderTop={1}
                    borderColor="divider"
                  >
                    <Tooltip title="Visualizar">
                      <IconButton
                        size="small"
                        onClick={() => setPreviewDay(day)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'primary.lighter',
                          },
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setEditIndex(index)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'primary.lighter',
                          },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirm(index)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'error.lighter',
                          },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Dialog open={!!previewDay} onClose={() => setPreviewDay(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {previewDay
            ? isValidWeekDay(previewDay.day)
              ? WeekDayLabel[previewDay.day]
              : previewDay.day
            : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Tópico:</strong> {previewDay?.topic}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Versículo:</strong> {previewDay?.verse}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDay(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmar Remoção</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Deseja remover o dia{' '}
            <strong>
              {deleteConfirm !== null
                ? isValidWeekDay(days[deleteConfirm].day)
                  ? WeekDayLabel[days[deleteConfirm].day as WeekDay]
                  : days[deleteConfirm].day
                : ''}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button
            onClick={() => {
              if (deleteConfirm !== null) {
                const updated = [...days];
                updated.splice(deleteConfirm, 1);
                onDaysChange(updated);
                setDeleteConfirm(null);
              }
            }}
            color="error"
            variant="contained"
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
