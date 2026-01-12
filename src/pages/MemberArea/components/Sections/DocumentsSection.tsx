import React, { Fragment, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import api from '@/config/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/slices';
import {
  setDocumentData,
  clearDocumentData,
} from 'store/slices/documents/documentSlice';
import MediaDocumentPreviewModal from 'utils/MediaDocumentPreviewModal';
import { RouteData } from 'store/slices/route/routeSlice';

const DocumentsSection: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const documentData = useSelector(
    (state: RootState) => state.document.documentData
  );
  const routes = useSelector((state: RootState) => state.routes.routes);
  const documentsScrollRef = useRef<HTMLDivElement | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentRoutes = routes.filter(
    (route) => route.entityType === 'Document'
  );

  const handleOpenModal = async (route: RouteData) => {
    try {
      const response = await api.get(`/documents/${route.idToFetch}`);
      dispatch(setDocumentData(response.data));
      setOpenModal(true);
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Não foi possível carregar o documento.');
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    dispatch(clearDocumentData());
  };

  const scrollDocuments = (direction: 'left' | 'right') => {
    if (documentsScrollRef.current) {
      const container = documentsScrollRef.current;
      const cardWidth = isMobile ? 260 : 300;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
      const currentScroll = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      let targetScroll: number;
      if (direction === 'left') {
        const targetPosition = currentScroll - scrollAmount;
        targetScroll = Math.max(0, targetPosition);
      } else {
        const targetPosition = currentScroll + scrollAmount;
        const maxScroll = container.scrollWidth - containerWidth;
        targetScroll = Math.min(maxScroll, targetPosition);
      }
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, md: 4 },
          mt: 0,
          background: 'linear-gradient(135deg, rgba(2, 136, 209, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)',
          borderRadius: 3,
          border: '1px solid rgba(2, 136, 209, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(180deg, #0288d1 0%, #01579b 100%)',
            borderRadius: '0 4px 4px 0',
          },
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: { xs: 2.5, md: 4 },
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              p: { xs: 1, md: 1.5 },
              borderRadius: 2,
              background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
              color: 'white',
              mr: { xs: 1.5, md: 2 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 136, 209, 0.3)',
            }}
          >
            <DescriptionIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.8rem' } }} />
          </Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.6rem' },
              background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.3px',
            }}
          >
            Documentos Importantes
          </Typography>
        </Box>

      {error ? (
        <Typography variant="body2" color="error" textAlign="center">
          {error}
        </Typography>
      ) : documentRoutes.length > 0 ? (
        <Fragment>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
            }}
          >
            {documentRoutes.length > (isMobile ? 1 : 2) && (
              <IconButton
                onClick={() => scrollDocuments('left')}
                sx={{
                  position: 'absolute',
                  left: { xs: -2, sm: 8 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  color: '#0288d1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  zIndex: 3,
                  width: { xs: 32, sm: 40, md: 44 },
                  height: { xs: 32, sm: 40, md: 44 },
                  '&:hover': {
                    bgcolor: '#0288d1',
                    color: 'white',
                    transform: 'translateY(-50%) scale(1.1)',
                    boxShadow: '0 6px 16px rgba(2, 136, 209, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
              </IconButton>
            )}

            <Box
              ref={documentsScrollRef}
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                px: { xs: 12, sm: 6, md: 7 },
                py: 2,
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(2, 136, 209, 0.1)',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(2, 136, 209, 0.3)',
                  borderRadius: 4,
                  '&:hover': {
                    background: 'rgba(2, 136, 209, 0.5)',
                  },
                },
              }}
                >
              {documentRoutes.map((route) => (
                  <Card
                  key={route.id}
                    elevation={2}
                    sx={{
                    minWidth: { xs: 260, sm: 300 },
                    maxWidth: { xs: 260, sm: 300 },
                      borderRadius: 3,
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(2, 136, 209, 0.1)',
                    scrollSnapAlign: 'center',
                    scrollSnapStop: 'always',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(2, 136, 209, 0.2)',
                        borderColor: '#0288d1',
                      },
                    }}
                    onClick={() => handleOpenModal(route)}
                  >
                    <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          color: '#0288d1',
                          mb: { xs: 1, md: 1.5 },
                          fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                          lineHeight: 1.3,
                        }}
                      >
                        {route.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.6,
                          fontSize: { xs: '0.85rem', md: '0.9rem' },
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                        }}
                      >
                        {route.description || 'Sem descrição'}
                      </Typography>
                    </CardContent>
                  </Card>
            ))}
            </Box>

            {documentRoutes.length > (isMobile ? 1 : 2) && (
              <IconButton
                onClick={() => scrollDocuments('right')}
                  sx={{
                  position: 'absolute',
                  right: { xs: -2, sm: 8 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  color: '#0288d1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  zIndex: 3,
                  width: { xs: 32, sm: 40, md: 44 },
                  height: { xs: 32, sm: 40, md: 44 },
                    '&:hover': {
                    bgcolor: '#0288d1',
                    color: 'white',
                    transform: 'translateY(-50%) scale(1.1)',
                      boxShadow: '0 6px 16px rgba(2, 136, 209, 0.4)',
                    },
                  transition: 'all 0.3s ease',
                  }}
                >
                <ChevronRightIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
              </IconButton>
            )}
            </Box>
        </Fragment>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
        >
          Nenhum documento disponível no momento.
        </Typography>
      )}

      <MediaDocumentPreviewModal
        open={openModal}
        onClose={handleCloseModal}
        media={documentData?.media || null}
        title={documentData?.name}
      />
      </Paper>
    </motion.div>
  );
};

export default DocumentsSection;
