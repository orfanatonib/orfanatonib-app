import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  IconButton, 
  Paper, 
  Container,
  Card,
  CardContent,
} from '@mui/material';
import { Delete, ArrowBack, Event, Add, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface EventItem {
  title: string;
  date: string;
  location: string;
}

export default function EventPageCreator() {
  const navigate = useNavigate();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [newEvent, setNewEvent] = useState<EventItem>({ title: '', date: '', location: '' });

  const [errors, setErrors] = useState({
    pageTitle: false,
    pageDescription: false,
    newEventTitle: false,
    newEventDate: false,
    newEventLocation: false,
  });
  const [touched, setTouched] = useState({
    pageTitle: false,
    pageDescription: false,
    newEventTitle: false,
    newEventDate: false,
    newEventLocation: false,
  });

  const handleAddEvent = () => {
    setTouched((prev) => ({
      ...prev,
      newEventTitle: true,
      newEventDate: true,
      newEventLocation: true,
    }));
    
    const hasError = !newEvent.title || !newEvent.date || !newEvent.location;
    setErrors((prev) => ({
      ...prev,
      newEventTitle: !newEvent.title,
      newEventDate: !newEvent.date,
      newEventLocation: !newEvent.location,
    }));
    if (hasError) return;

    setEvents([...events, newEvent]);
    setNewEvent({ title: '', date: '', location: '' });
    setTouched((prev) => ({
      ...prev,
      newEventTitle: false,
      newEventDate: false,
      newEventLocation: false,
    }));
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleSavePage = async () => {
    setTouched((prev) => ({
      ...prev,
      pageTitle: true,
      pageDescription: true,
    }));
    
    const hasError = !pageTitle || !pageDescription || events.length === 0;
    setErrors((prev) => ({
      ...prev,
      pageTitle: !pageTitle,
      pageDescription: !pageDescription,
    }));
    if (hasError) return;

    const payload = {
      pageTitle,
      pageDescription,
      events,
    };

    try {
      const res = await fetch('/events-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar página');
    } catch (err) {
      console.error('Erro ao salvar página', err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            📅 Criar Página de Eventos
          </Typography>
        </Box>

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
            Informações Básicas
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Título da Página"
                fullWidth
                required
                value={pageTitle}
                onChange={(e) => {
                  setPageTitle(e.target.value);
                  if (touched.pageTitle) setTouched((prev) => ({ ...prev, pageTitle: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, pageTitle: true }))}
                error={touched.pageTitle && errors.pageTitle}
                helperText={touched.pageTitle && errors.pageTitle ? 'Campo obrigatório' : ''}
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição da Página"
                fullWidth
                required
                multiline
                rows={4}
                value={pageDescription}
                onChange={(e) => {
                  setPageDescription(e.target.value);
                  if (touched.pageDescription) setTouched((prev) => ({ ...prev, pageDescription: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, pageDescription: true }))}
                error={touched.pageDescription && errors.pageDescription}
                helperText={touched.pageDescription && errors.pageDescription ? 'Campo obrigatório' : ''}
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
            </Grid>
          </Grid>
        </Paper>

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
            ➕ Adicionar Evento / Treinamento
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Título do Evento"
                fullWidth
                required
                value={newEvent.title}
                onChange={(e) => {
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }));
                  if (touched.newEventTitle) setTouched((prev) => ({ ...prev, newEventTitle: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, newEventTitle: true }))}
                error={touched.newEventTitle && errors.newEventTitle}
                helperText={touched.newEventTitle && errors.newEventTitle ? 'Campo obrigatório' : ''}
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
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Data do Evento"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={newEvent.date}
                onChange={(e) => {
                  setNewEvent((prev) => ({ ...prev, date: e.target.value }));
                  if (touched.newEventDate) setTouched((prev) => ({ ...prev, newEventDate: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, newEventDate: true }))}
                error={touched.newEventDate && errors.newEventDate}
                helperText={touched.newEventDate && errors.newEventDate ? 'Campo obrigatório' : ''}
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
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Local do Evento"
                fullWidth
                required
                value={newEvent.location}
                onChange={(e) => {
                  setNewEvent((prev) => ({ ...prev, location: e.target.value }));
                  if (touched.newEventLocation) setTouched((prev) => ({ ...prev, newEventLocation: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, newEventLocation: true }))}
                error={touched.newEventLocation && errors.newEventLocation}
                helperText={touched.newEventLocation && errors.newEventLocation ? 'Campo obrigatório' : ''}
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
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Add />}
                onClick={handleAddEvent}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Adicionar Evento
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {events.length > 0 && (
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
              📋 Eventos Adicionados ({events.length})
            </Typography>
            <Grid container spacing={3}>
              {events.map((event, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-4px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <CardContent>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveEvent(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        📅 {new Date(event.date).toLocaleDateString('pt-BR')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📍 {event.location}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: 2,
                bgcolor: 'action.hover',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleSavePage}
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
            Salvar Página
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
