import { memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Stack,
  Typography,
  useTheme,
  alpha,
  Button,
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import AddTaskIcon from '@mui/icons-material/AddTask';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { AttendanceMode } from '../types';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface AttendanceModeSelectorProps {
  onModeSelect: (mode: AttendanceMode) => void;
}

const AttendanceModeSelector = memo(({ onModeSelect }: AttendanceModeSelectorProps) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 8 },
        px: { xs: 2, sm: 3 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
      }}
    >
      <Box sx={{ maxWidth: 1000, width: '100%' }}>
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <IconButton
            onClick={() => navigate('/adm')}
            aria-label="Voltar para dashboard"
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
                transform: 'translateX(-4px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Header Section */}
        <Stack spacing={2} alignItems="center" sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            textAlign="center"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Controle de Frequência
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              maxWidth: 600,
            }}
          >
            Gerencie a presença das equipes em seus abrigos de forma organizada e eficiente
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {/* Opção: Listar Pagelas */}
          <Grid item xs={12} sm={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
                  borderColor: theme.palette.primary.main,
                  '& .icon-wrapper': {
                    transform: 'scale(1.1) rotate(5deg)',
                  },
                  '& .action-button': {
                    transform: 'translateX(4px)',
                    opacity: 1,
                  },
                },
              }}
            >
              <CardActionArea
                onClick={() => onModeSelect('list')}
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 4 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Icon Wrapper */}
                <Box
                  className="icon-wrapper"
                  sx={{
                    width: { xs: 90, md: 110 },
                    height: { xs: 90, md: 110 },
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <VisibilityIcon sx={{ fontSize: { xs: 45, md: 55 } }} />
                </Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    mb: 2,
                  }}
                >
                  Listar Frequências
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', md: '0.9375rem' },
                    mb: 3,
                    lineHeight: 1.6,
                    minHeight: { xs: 60, md: 48 },
                  }}
                >
                  Visualize todas as frequências (registros de presença) organizadas por abrigo, equipe e agendamento
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Opção: Lançar Pagelas */}
          <Grid item xs={12} sm={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.success.main, 0.25)}`,
                  borderColor: theme.palette.success.main,
                  '& .icon-wrapper': {
                    transform: 'scale(1.1) rotate(-5deg)',
                  },
                  '& .action-button': {
                    transform: 'translateX(4px)',
                    opacity: 1,
                  },
                },
              }}
            >
              <CardActionArea
                onClick={() => onModeSelect('register')}
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 4 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                {/* Icon Wrapper */}
                <Box
                  className="icon-wrapper"
                  sx={{
                    width: { xs: 90, md: 110 },
                    height: { xs: 90, md: 110 },
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.4)}`,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <EditNoteIcon sx={{ fontSize: { xs: 45, md: 55 } }} />
                </Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    mb: 2,
                  }}
                >
                  Lançar Frequências
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.875rem', md: '0.9375rem' },
                    mb: 3,
                    lineHeight: 1.6,
                    minHeight: { xs: 60, md: 48 },
                  }}
                >
                  Registre presença ou falta para os membros de uma equipe em um evento específico
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
});

AttendanceModeSelector.displayName = 'AttendanceModeSelector';

export default AttendanceModeSelector;


