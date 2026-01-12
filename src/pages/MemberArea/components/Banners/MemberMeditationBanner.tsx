import { Fragment, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Paper,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import MediaDocumentPreviewModal from 'utils/MediaDocumentPreviewModal';
import { AppDispatch, RootState } from 'store/slices';
import { useDispatch, useSelector } from 'react-redux';
import {
  setMeditationData,
  MeditationData,
  WeekDayLabel,
} from '@/store/slices/meditation/meditationSlice';
import { MediaType, MediaUploadType } from '@/store/slices/types';
import api from '@/config/axiosConfig';
import { motion } from 'framer-motion';
import { BANNER_HEIGHTS } from './constants';

export default function MemberMeditationBanner() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const currentMeditation = useSelector(
    (state: RootState) => state.meditation.meditationData
  );

  const routes = useSelector((state: RootState) => state.routes.routes);

  const today = new Date();
  const weekdayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  const meditationDay = routes.find(
    (route) =>
      route.entityType === 'MeditationDay' &&
      route.path.toLowerCase().includes(weekdayName.toLowerCase())
  );

  if (!meditationDay) {
    return null;
  }

  const handleOpenPreview = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/meditations/${meditationDay?.idToFetch}`);
      if (response.data?.meditation) {
        dispatch(setMeditationData(response.data.meditation as MeditationData));
        setOpenModal(true);
      }
    } catch (error) {
      console.error('Error loading meditation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          minHeight: { xs: 280, sm: 250, md: 280 },
          maxHeight: { xs: 320, sm: 300, md: 320 },
          height: { xs: 280, sm: 250, md: 280 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: { xs: 2, md: 3 },
          background: 'linear-gradient(135deg, #00796b 0%, #004d40 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          height: { 
            xs: 'auto',
            sm: 'auto', 
            md: 350 
          },
          minHeight: { 
            xs: 300,
            sm: 300, 
            md: 280 
          },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #004d40 0%, #00695c 25%, #00897b 50%, #26a69a 75%, #4db6ac 100%)',
          color: '#e0f2f1',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 105, 92, 0.35)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -60,
            right: -60,
            width: 250,
            height: 250,
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0,
            animation: 'pulse 4s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 180,
            height: 180,
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0,
            animation: 'pulse 4s ease-in-out infinite 2s',
          },
          '@keyframes pulse': {
            '0%, 100%': {
              transform: 'scale(1)',
              opacity: 0.6,
            },
            '50%': {
              transform: 'scale(1.1)',
              opacity: 0.8,
            },
          },
        }}
      >
        <Box sx={{ 
          position: 'relative', 
          zIndex: 1, 
          width: '100%', 
          height: '100%',
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 2, md: 4 },
        }}>
          
          <Box sx={{ 
            flex: '0 0 30%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            textAlign: { xs: 'center', md: 'left' }
          }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.8rem' },
                textShadow: '2px 2px 6px rgba(0,0,0,0.4)',
                mb: { xs: 0.75, md: 1.5 },
              }}
            >
              Já meditou hoje?
            </Typography>

            <Typography
              variant="h6"
              fontWeight="medium"
              sx={{
                fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.1rem' },
                textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                mb: { xs: 0.75, md: 1.5 },
                opacity: 0.95,
              }}
            >
              Hoje é{' '}
              {meditationDay
                ? `${WeekDayLabel[meditationDay?.path as keyof typeof WeekDayLabel] || meditationDay?.path}.`
                : '...'}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.3rem' },
                fontWeight: 500,
                textShadow: '2px 2px 6px rgba(0,0,0,0.4)',
                mb: 0,
              }}
            >
              O tema de hoje é:{' '}
              <span style={{ fontWeight: 'bold' }}>{meditationDay.title}</span>
            </Typography>
          </Box>

          <Box sx={{ 
            flex: '0 0 70%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'center',
            height: '100%',
            position: 'relative',
            p: { xs: 0, sm: 2, md: 2 },
            m: { xs: 1, sm: 0, md: 0 },
          }}>
            <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', width: '100%' }}>
              <Box sx={{ 
                width: '100%', 
                height: 'auto',
                mb: 0,
                p: { xs: 2, sm: 2.5, md: 3.5 },
                m: { xs: 0.5, sm: 0, md: 0 },
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.2rem' },
                  textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
                  opacity: 0.95,
                  fontWeight: 600,
                  mb: { xs: 1.5, md: 2 },
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                }}
              >
                Versículo de hoje:
              </Typography>

              <Typography
                variant="h5"
                fontStyle="italic"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.2rem', md: '1.6rem' },
                  textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
                  opacity: 1,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  mb: 0,
                  textAlign: 'center',
                }}
              >
                "{meditationDay.subtitle}"
              </Typography>

              </Box>
            </Box>

            <Box sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', width: '100%', minHeight: '50px' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  size="medium"
                  onClick={handleOpenPreview}
                  disabled={loading}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    px: { xs: 2.5, sm: 3, md: 6 },
                    py: { xs: 0.9, sm: 1, md: 1.5 },
                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1.1rem' },
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    mt: { xs: 1, md: '5px' },
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.35)',
                      transform: { xs: 'none', md: 'translateY(-3px)' },
                      boxShadow: { xs: '0 4px 16px rgba(0,0,0,0.2)', md: '0 6px 20px rgba(0,0,0,0.3)' },
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                    },
                    transition: 'all 0.3s ease',
                    minWidth: { xs: '140px', sm: '160px', md: '200px' },
                  }}
                >
                  {loading ? 'Carregando...' : 'Visualizar Meditação'}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Box>

      </Paper>

      <MediaDocumentPreviewModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        media={currentMeditation?.media || null}
        title={currentMeditation?.topic || ''}
      />
    </motion.div>
  );
}