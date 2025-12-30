import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  Skeleton,
  Paper,
  Grid2,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import api from '@/config/axiosConfig';
import { RootState, AppDispatch } from '@/store/slices';
import { UserRole } from 'store/slices/auth/authSlice';
import ShelterSectionImageView from './ShelterSectionImageView';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {
  setSectionData,
  appendSections,
  updatePagination,
  PaginatedSectionResponse,
} from '@/store/slices/image-section-pagination/imageSectionPaginationSlice';
import ErrorState, { ErrorType } from '@/components/common/ErrorState';

interface ShelterFeedViewProps {
  idToFetch?: string;
  feed?: boolean;
}

function SectionSkeleton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 4 },
          mt: { xs: 2, md: 3 },
          mb: { xs: 3, md: 4 },
          borderRadius: { xs: 3, md: 4 },
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          border: `2px solid ${theme.palette.success.main}20`,
        }}
      >
        <Box textAlign="center" mb={3}>
          <Skeleton 
            variant="text" 
            width={220} 
            height={isMobile ? 24 : 32} 
            sx={{ 
              mx: 'auto', 
              borderRadius: 2,
            }} 
          />
          <Skeleton 
            variant="text" 
            width="60%" 
            sx={{ 
              mx: 'auto', 
              mt: 1,
              borderRadius: 1,
            }} 
          />
          <Skeleton 
            variant="text" 
            width="50%" 
            sx={{ 
              mx: 'auto', 
              mt: 1,
              borderRadius: 1,
            }} 
          />
          <Box 
            mt={2} 
            display="flex" 
            flexDirection="column" 
            alignItems={{ xs: 'center', md: 'flex-end' }}
          >
            <Skeleton variant="text" width={180} sx={{ borderRadius: 1 }} />
            <Skeleton variant="text" width={220} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
        <Skeleton
          variant="rectangular"
          sx={{ 
            width: '100%', 
            height: isMobile ? 200 : 400, 
            borderRadius: { xs: 2, md: 3 },
            mb: 2,
          }}
        />
        <Grid2 container spacing={1} justifyContent="center">
          {[...Array(6)].map((_, i) => (
            <Grid2 size={{ xs: 4, sm: 2, md: 2 }} key={i}>
              <Skeleton
                variant="rectangular"
                height={isMobile ? 60 : 80}
                sx={{
                  borderRadius: { xs: 2, md: 3 },
                }}
              />
            </Grid2>
          ))}
        </Grid2>
      </Paper>
    </motion.div>
  );
}

export default function ShelterFeedView({ feed = true }: ShelterFeedViewProps) {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('generic');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const section = useSelector((state: RootState) => state.imageSectionPagination.section);

  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
  const defaultSectionId = import.meta.env.VITE_FEED_MINISTERIO_ID;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastSectionRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) setPage((prev) => prev + 1);
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore]
  );

  const sectionsList = useMemo(() => section?.sections ?? [], [section?.sections]);

  useEffect(() => {
    dispatch(setSectionData(null as any));
    setInitialLoadComplete(false);
    setPage(1);
    setHasMore(true);
  }, [dispatch]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSectionData = async () => {
      try {
        setHasError(false);
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const sectionId = feed ? defaultSectionId : undefined;
        if (!sectionId) throw new Error('Nenhum ID de seção fornecido.');

        const { data } = await api.get<PaginatedSectionResponse>(
          `/image-pages/${sectionId}/sections?page=${page}&limit=2`,
          { signal: controller.signal }
        );

        if (page === 1) {
          dispatch(setSectionData(data));
          setLoading(false);
          setInitialLoadComplete(true);
        } else {
          dispatch(appendSections(data.sections));
          dispatch(updatePagination({ page: data.page, total: data.total }));
          setLoadingMore(false);
        }

        setHasMore(data.page * data.limit < data.total);
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Error loading section:', err);

          let type: ErrorType = 'generic';

          if (err.response?.status === 404) {
            type = '404';
          } else if (err.response?.status === 500) {
            type = '500';
          } else if (err.code === 'ERR_NETWORK' || !err.response) {
            type = 'network';
          }

          setErrorType(type);
          setHasError(true);
          if (page === 1) {
            setLoading(false);
            setInitialLoadComplete(true);
          } else {
            setLoadingMore(false);
          }
        }
      }
    };

    fetchSectionData();

    return () => controller.abort();
  }, [page, defaultSectionId, dispatch, feed, retryTrigger]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: { xs: 3, md: 4 },
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              zIndex: 0,
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
              flexWrap="wrap"
              gap={2}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={handleBack}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <PhotoLibraryIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
              </Box>

              {feed && isAuthenticated && (
                <Button
                  component={Link}
                  to="/imagens-abrigo"
                  variant="contained"
                  startIcon={!isMobile && <PhotoCameraIcon />}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.95)',
                    color: '#2e7d32',
                    fontWeight: 'bold',
                    px: { xs: 2, sm: 2.5, md: 3.5 },
                    py: { xs: 1, sm: 1.25, md: 1.5 },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    border: '2px solid',
                    borderColor: 'rgba(255,255,255,0.3)',
                    whiteSpace: { xs: 'nowrap', sm: 'normal' },
                    minWidth: { xs: 'auto', sm: 'auto' },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,1)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                      transform: 'translateY(-2px)',
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isMobile ? (
                    <>
                      <PhotoCameraIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
                      Enviar Fotos
                    </>
                  ) : (
                    'Envie fotos do seu Abrigo'
                  )}
                </Button>
              )}
            </Box>

            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              📰 Feed Orfanato
            </Typography>

            <Typography
              variant="h5"
              fontWeight="600"
              sx={{
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                mb: 2,
                opacity: 0.95,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              Acompanhe as novidades e atividades
            </Typography>

            <Box
              display="flex"
              alignItems="center"
              gap={2}
              mt={3}
              flexWrap="wrap"
            >
              <Chip
                label={`${sectionsList.length} ${sectionsList.length === 1 ? 'Seção' : 'Seções'}`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {!initialLoadComplete ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {[...Array(2)].map((_, i) => (
            <SectionSkeleton key={i} />
          ))}
        </motion.div>
      ) : hasError ? (
        <ErrorState
          type={errorType}
          onRetry={() => {
            setHasError(false);
            setInitialLoadComplete(false);
            setPage(1);
            setRetryTrigger(prev => prev + 1);
          }}
        />
      ) : !section ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: { xs: 3, md: 4 },
            }}
          >
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontSize: { xs: '1.3rem', md: '1.5rem' },
                mb: 2,
              }}
            >
              📸 Nenhuma página de imagens encontrada
            </Typography>
            <Typography color="text.secondary">
              A página de imagens solicitada não existe ou foi removida.
            </Typography>
          </Paper>
        </motion.div>
      ) : (
        <AnimatePresence>
          {sectionsList.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {sectionsList.map((sectionItem, index) => (
                <motion.div
                  key={sectionItem.id}
                  ref={index === sectionsList.length - 1 ? lastSectionRef : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{
                    marginBottom: index < sectionsList.length - 1 ? theme.spacing(2) : 0
                  }}
                >
                  <ShelterSectionImageView
                    caption={sectionItem.caption}
                    description={sectionItem.description}
                    mediaItems={sectionItem.mediaItems}
                    createdAt={sectionItem.createdAt ? new Date(sectionItem.createdAt) : undefined}
                    updatedAt={sectionItem.updatedAt ? new Date(sectionItem.updatedAt) : undefined}
                  />
                </motion.div>
              ))}

              {loadingMore && (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  py={4}
                >
                  <CircularProgress size={40} />
                </Box>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: { xs: 3, md: 4 },
                }}
              >
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  📸 Nenhuma seção disponível
                </Typography>
                <Typography color="text.secondary">
                  As seções de imagens ainda não foram publicadas.
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </Container>
  );
}


