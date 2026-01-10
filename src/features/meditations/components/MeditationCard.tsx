import React, { Fragment, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tooltip,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Delete,
  PictureAsPdf,
  Visibility,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  MeditationData, DayItem, WeekDay, WeekDayLabel, setMeditationData,
} from '@/store/slices/meditation/meditationSlice';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/slices';
import { getMediaPreviewUrl } from 'utils/getMediaPreviewUrl';
import MediaDocumentPreviewModal from 'utils/MediaDocumentPreviewModal';
import { useTheme } from '@mui/material/styles';

interface Props {
  meditation: MeditationData;
  onDelete: (meditation: MeditationData) => void;
  onDayClick: (day: DayItem) => void;
  formatDate: (iso: string) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function MeditationCard({
  meditation,
  onDelete,
  onDayClick,
  formatDate,
  isExpanded,
  onToggleExpand,
}: Props) {
  const [open, setOpen] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const previewUrl = getMediaPreviewUrl(meditation.media);

  const handleEdit = () => {
    dispatch(setMeditationData(meditation));
    navigate('/adm/editar-meditacao');
  };

  return (
    <Fragment>
      <Box
        ref={cardRef}
        sx={{
          position: 'relative',
          width: '100%',
          zIndex: isExpanded ? 1000 : 1,
        }}
      >
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            transition: 'transform .2s, box-shadow .2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            position: 'relative',
            bgcolor: 'background.paper',
          }}
        >
          <Tooltip title="Excluir meditação">
            <IconButton
              size="small"
              onClick={() => onDelete(meditation)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                color: '#d32f2f',
                zIndex: 2,
              }}
              aria-label="Excluir meditação"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>

          <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textAlign: 'center',
                mt: 0.5,
              }}
              title={meditation.topic}
              gutterBottom
            >
              {meditation.topic}
            </Typography>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              {formatDate(meditation.startDate)} — {formatDate(meditation.endDate)}
            </Typography>

            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={1}>
              <Typography fontWeight="bold">
                Dias ({meditation.days.length})
              </Typography>

              <Tooltip title={isExpanded ? 'Recolher' : 'Expandir'}>
                <IconButton
                  size="small"
                  onClick={onToggleExpand}
                  aria-label={isExpanded ? 'Recolher dias' : 'Expandir dias'}
                  aria-expanded={isExpanded}
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.lighter',
                    },
                  }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>

        {isExpanded && (
          <Card
            variant="outlined"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              zIndex: 1001,
              bgcolor: 'background.paper',
              border: '2px solid',
              borderColor: 'primary.main',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <CardContent sx={{ pb: 1.5 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  textAlign: 'center',
                  mt: 0.5,
                }}
                gutterBottom
              >
                {meditation.topic}
              </Typography>

              <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
                {formatDate(meditation.startDate)} — {formatDate(meditation.endDate)}
              </Typography>

              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography fontWeight="bold">
                  Dias ({meditation.days.length})
                </Typography>

                <Tooltip title="Recolher">
                  <IconButton
                    size="small"
                    onClick={onToggleExpand}
                    aria-label="Recolher dias"
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.lighter',
                      },
                    }}
                  >
                    <ExpandLessIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack spacing={1} mb={2}>
                {meditation.days.map((day) => (
                  <Paper
                    key={day.id}
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.2,
                      px: 2,
                      border: '1px solid #e5e7eb',
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                      '&:hover': {
                        bgcolor: '#f0f0f0',
                        borderColor: 'primary.main',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Typography fontWeight="medium">
                      {WeekDayLabel[day.day as WeekDay]}
                    </Typography>
                    <Tooltip title="Ver detalhes do dia">
                      <IconButton
                        size="small"
                        onClick={() => onDayClick(day)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
              </Stack>

              {meditation.media?.url && (
                <Box textAlign="center" mb={2}>
                  <Button
                    startIcon={<PictureAsPdf />}
                    variant="text"
                    size="small"
                    onClick={() => setOpen(true)}
                  >
                    Ver Material
                  </Button>
                </Box>
              )}
            </CardContent>

            <CardActions
              sx={{
                p: 2,
                pt: 0,
                gap: 1,
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Editar
              </Button>
            </CardActions>
          </Card>
        )}
      </Box>

      <MediaDocumentPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        media={{ ...meditation.media, url: previewUrl }}
      />
    </Fragment>
  );
}
