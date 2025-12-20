import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Card,
  CardContent,
  Grid,
  Collapse,
  Divider,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/config/axiosConfig';
import { fetchRoutes } from 'store/slices/route/routeSlice';
import { RootState, AppDispatch } from 'store/slices';
import { setIdeasData, IdeasPageData } from 'store/slices/ideas/ideasSlice';
import IdeasDocumentViewer from './IdeasDocumentViewer';
import IdeasImageGalleryView from './IdeasImageGalleryView';
import IdeasVideoPlayerView from './IdeasVideoPlayerView';
import { UserRole } from '@/store/slices/auth/authSlice';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

interface IdeasPageViewProps {
  idToFetch: string;
}

interface MediaSectionProps {
  sectionId: string;
  sectionIndex: number;
  title: string;
  description: string;
  videos: any[];
  documents: any[];
  images: any[];
  expandedMediaTypes: { [key: string]: boolean };
  onToggleMediaType: (sectionId: string, mediaType: string) => void;
}

function MediaSection({
  sectionId,
  sectionIndex,
  title,
  description,
  videos,
  documents,
  images,
  expandedMediaTypes,
  onToggleMediaType,
}: MediaSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const MediaTypeCard = ({
    type,
    icon,
    items,
    color,
    emoji
  }: {
    type: string;
    icon: React.ReactNode;
    items: any[];
    color: string;
    emoji: string;
  }) => {
    if (items.length === 0) return null;

    const isExpanded = expandedMediaTypes[`${sectionId}-${type}`];
    const key = `${sectionId}-${type}`;

    return (
      <Card
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: 1,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 3,
            borderColor: color,
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              py: 0.5,
            }}
            onClick={() => onToggleMediaType(sectionId, type)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.75, sm: 1 },
                  color: color,
                }}
              >
                {icon}
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    color: color,
                  }}
                >
                  {emoji} {type === 'videos' ? 'Vídeos' : type === 'documents' ? 'Documentos' : 'Imagens'}
                </Typography>
              </Box>
              <Chip
                label={items.length}
                size="small"
                sx={{
                  bgcolor: `${color}15`,
                  color: color,
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  height: { xs: 24, sm: 28 },
                }}
              />
            </Box>
            <IconButton
              size="small"
              sx={{
                color: color,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  bgcolor: `${color}10`,
                },
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Box>

          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2 }} />
            <Grid
              container
              spacing={3}
              sx={{ mt: 1 }}
            >
              {items.map((item, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={item.id || index}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 4,
                          borderColor: color,
                        }
                      }}
                    >
                      {type === 'videos' && <IdeasVideoPlayerView video={item} />}
                      {type === 'documents' && <IdeasDocumentViewer document={item} />}
                      {type === 'images' && <IdeasImageGalleryView image={item} />}
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 3,
          boxShadow: 2,
          mb: 4,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            mb={{ xs: 1.5, sm: 2 }}
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              lineHeight: 1.3,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body1"
              color="text.secondary"
              mb={{ xs: 2, sm: 3 }}
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          )}

          <Box sx={{ mt: { xs: 2, sm: 3 } }}>
            <MediaTypeCard
              type="videos"
              icon={<VideoLibraryIcon />}
              items={videos}
              color={theme.palette.error.main}
              emoji="🎬"
            />
            <MediaTypeCard
              type="documents"
              icon={<PictureAsPdfIcon />}
              items={documents}
              color={theme.palette.success.main}
              emoji="📄"
            />
            <MediaTypeCard
              type="images"
              icon={<ImageIcon />}
              items={images}
              color={theme.palette.warning.main}
              emoji="🖼️"
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function IdeasPageView({ idToFetch }: IdeasPageViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ideasPage, setIdeasPage] = useState<IdeasPageData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedMediaTypes, setExpandedMediaTypes] = useState<{ [key: string]: boolean }>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/ideas-pages/${idToFetch}`);
        setIdeasPage(response.data);
        dispatch(setIdeasData(response.data));
      } catch (err) {
        setError('Erro ao carregar a página de ideias. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idToFetch, dispatch]);

  const handleDeletePage = async () => {
    try {
      if (!ideasPage?.id) return;
      setIsDeleting(true);
      await api.delete(`/ideas-pages/${ideasPage.id}`);
      await dispatch(fetchRoutes());
      navigate('/');
    } catch (err) {
      setError('Erro ao excluir a página. Tente novamente mais tarde.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEdit = () => {
    navigate('/adm/editar-pagina-ideias', { state: { fromTemplatePage: false } });
  };

  const toggleMediaType = (sectionId: string, mediaType: string) => {
    const key = `${sectionId}-${mediaType}`;
    setExpandedMediaTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" mt={2} color="text.secondary">
            Carregando página de ideias...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Alert
          severity="error"
          sx={{
            maxWidth: 500,
            width: '100%',
            fontSize: '1.1rem',
            borderRadius: 3,
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!ideasPage) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography
          variant="h5"
          align="center"
          color="text.secondary"
          sx={{ maxWidth: 400 }}
        >
          Nenhuma página de ideias encontrada.
        </Typography>
      </Box>
    );
  }

  const { title, subtitle, description, sections } = ideasPage;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: { xs: 2, sm: 3, md: 4 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
              <IconButton
                onClick={handleBack}
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
                <ArrowBackIcon />
              </IconButton>
              {isAdmin && (
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                  <IconButton
                    onClick={handleEdit}
                    sx={{
                      bgcolor: 'warning.lighter',
                      color: 'warning.main',
                      '&:hover': {
                        bgcolor: 'warning.light',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                    aria-label="Editar página"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setDeleteConfirmOpen(true)}
                    sx={{
                      bgcolor: 'error.lighter',
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.light',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                    aria-label="Excluir página"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box textAlign="center">
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  mb: { xs: 1, sm: 2 },
                  lineHeight: 1.2,
                  color: 'text.primary',
                }}
              >
                💡 {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                    fontWeight: 500,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
              {description && (
                <Typography
                  variant="body1"
                  maxWidth={{ xs: '100%', md: '800px' }}
                  mx="auto"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: 1.6,
                    color: 'text.secondary',
                  }}
                >
                  {description}
                </Typography>
              )}
            </Box>
          </Container>
        </Box>
      </motion.div>

      {/* Content Section */}
      <Box
        sx={{
          flex: 1,
          py: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="xl">
          <AnimatePresence>
            {sections.map((section, sectionIndex) => {
              const videos = section.medias.filter((media) => media.mediaType === 'video');
              const documents = section.medias.filter((media) => media.mediaType === 'document');
              const images = section.medias.filter((media) => media.mediaType === 'image');

              return (
                <MediaSection
                  key={section.id || sectionIndex}
                  sectionId={section.id || sectionIndex.toString()}
                  sectionIndex={sectionIndex}
                  title={section.title}
                  description={section.description}
                  videos={videos}
                  documents={documents}
                  images={images}
                  expandedMediaTypes={expandedMediaTypes}
                  onToggleMediaType={toggleMediaType}
                />
              );
            })}
          </AnimatePresence>
        </Container>
      </Box>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        title={ideasPage.title}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (isDeleting) return;
          await handleDeletePage();
        }}
        loading={isDeleting}
      />
    </Box>
  );
}