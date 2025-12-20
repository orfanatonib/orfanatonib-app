import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Container, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  LocationOn as LocationIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

import { RootState } from '@/store/slices';
import { MediaTargetType } from 'store/slices/types';

interface ShelterCard {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  path: string;
  entityType: string;
}

const AUTO_PLAY_INTERVAL = 3000;
const SLIDE_ANIMATION_DURATION = 0.7;

const SheltersSection: React.FC = () => {
  const navigate = useNavigate();
  const routes = useSelector((state: RootState) => state.routes.routes);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [shelterCards, setShelterCards] = useState<ShelterCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const filteredShelters = routes.filter(
      (card) => card.public && card.entityType === MediaTargetType.ShelterPage
    );
    setShelterCards(filteredShelters as ShelterCard[]);
  }, [routes]);

  useEffect(() => {
    if (shelterCards.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      goToNext();
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [shelterCards.length, currentIndex, isPaused]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % shelterCards.length);
  }, [shelterCards.length]);

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + shelterCards.length) % shelterCards.length);
  }, [shelterCards.length]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  if (!shelterCards.length) return null;

  const currentCard = shelterCards[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fff9f0 0%, #ffe8d6 50%, #fff5eb 100%)',
        py: { xs: 4, md: 6 },
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at 20% 50%, rgba(255, 152, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 87, 34, 0.08) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      <Container
        maxWidth="xl"
        sx={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: { xs: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <HomeIcon
              sx={{
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                color: '#ff9800',
              }}
            />
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '1.2rem', sm: '2rem', md: '2.5rem' },
                fontWeight: 800,
                background: 'linear-gradient(45deg, #ff9800 30%, #ff5722 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                fontFamily: "'Poppins', sans-serif",
                px: { xs: 2, md: 0 },
              }}
            >
              Abrigos onde estamos presentes
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#5a6c7d',
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.05rem' },
              maxWidth: '850px',
              lineHeight: { xs: 1.5, md: 1.6 },
              fontWeight: 500,
              px: { xs: 3, sm: 4, md: 0 },
            }}
          >
            Levamos amor e o ensino da palavra de Deus para adultos, crianças e adolescentes do jeito que Jesus Cristo nos ensinou
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            height: { xs: 'auto', md: '400px' },
            minHeight: { xs: '420px', sm: '400px', md: '400px' },
            borderRadius: { xs: 2, md: 4 },
            overflow: 'hidden',
            boxShadow: { xs: '0 10px 30px rgba(255, 152, 0, 0.15)', md: '0 20px 60px rgba(255, 152, 0, 0.2)' },
          }}
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            >
              <Box
                onClick={() => {
                  if (isAuthenticated) {
                    navigate(`/${currentCard.path}`);
                  }
                }}
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,249,240,0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  cursor: isAuthenticated ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease, boxShadow 0.2s ease',
                  opacity: isAuthenticated ? 1 : 0.8,
                  ...(isAuthenticated && {
                  '&:hover': {
                    transform: 'scale(1.01)',
                    boxShadow: '0 8px 32px rgba(255, 152, 0, 0.25)',
                  },
                  }),
                }}
              >
                  <Box
                    sx={{
                      width: { xs: '100%', md: '45%' },
                      height: { xs: '220px', sm: '250px', md: '100%' },
                      position: 'relative',
                      overflow: 'hidden',
                      order: { xs: 1, md: 0 },
                    }}
                  >
                    <Box
                      component="img"
                      src={currentCard.image || '/placeholder-shelter.jpg'}
                      alt={currentCard.title || 'Imagem do abrigo'}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, transparent 100%)',
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      width: { xs: '100%', md: '55%' },
                      height: { xs: 'auto', md: '100%' },
                      p: { xs: 2.5, sm: 3, md: 4, lg: 5 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: { xs: 1.2, sm: 1.5, md: 2 },
                      order: { xs: 2, md: 1 },
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.9rem', lg: '2.2rem' },
                        fontWeight: 800,
                        color: '#2c3e50',
                        fontFamily: "'Poppins', sans-serif",
                        lineHeight: 1.2,
                        mb: { xs: 0.3, md: 0.5 },
                      }}
                    >
                      {currentCard.title || 'Sem título'}
                    </Typography>

                    {currentCard.subtitle && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 0.6, md: 0.8 },
                          mb: { xs: 0.3, md: 0.5 },
                        }}
                      >
                        <LocationIcon
                          sx={{
                            fontSize: { xs: '1rem', md: '1.3rem' },
                            color: '#ff9800',
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem', lg: '1.1rem' },
                            fontWeight: 600,
                            color: '#ff9800',
                          }}
                        >
                          {currentCard.subtitle}
                        </Typography>
                      </Box>
                    )}

                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem', lg: '1.05rem' },
                        color: '#5a6c7d',
                        lineHeight: { xs: 1.6, md: 1.7 },
                        display: '-webkit-box',
                        WebkitLineClamp: { xs: 3, sm: 4, md: 5 },
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentCard.description || 'Conheça mais sobre este abrigo e descubra como fazemos a diferença na vida das crianças.'}
                    </Typography>
                  </Box>
                </Box>
            </motion.div>
          </AnimatePresence>

          {shelterCards.length > 1 && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                sx={{
                  position: 'absolute',
                  left: { xs: 4, sm: 8, md: 16 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'rgba(255, 152, 0, 0.9)',
                  color: 'white',
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  '&:hover': {
                    bgcolor: 'rgba(255, 87, 34, 1)',
                    transform: 'translateY(-50%) scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
              </IconButton>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                sx={{
                  position: 'absolute',
                  right: { xs: 4, sm: 8, md: 16 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'rgba(255, 152, 0, 0.9)',
                  color: 'white',
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  '&:hover': {
                    bgcolor: 'rgba(255, 87, 34, 1)',
                    transform: 'translateY(-50%) scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ChevronRightIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
              </IconButton>
            </>
          )}

          {shelterCards.length > 1 && (() => {
            const MAX_DOTS = 5;
            
            if (shelterCards.length <= MAX_DOTS) {
              return (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: 12, md: 16 },
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: { xs: 0.8, md: 1 },
                    zIndex: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 3,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  {shelterCards.map((_, index) => (
                    <Box
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToSlide(index);
                      }}
                      sx={{
                        width: currentIndex === index ? { xs: 28, md: 32 } : { xs: 10, md: 12 },
                        height: { xs: 10, md: 12 },
                        borderRadius: { xs: 5, md: 6 },
                        bgcolor: currentIndex === index ? '#ff9800' : 'rgba(255, 152, 0, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: currentIndex === index ? '#ff5722' : 'rgba(255, 152, 0, 0.6)',
                        },
                      }}
                    />
                  ))}
                </Box>
              );
            }
            
            return (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: { xs: 12, md: 16 },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: { xs: 0.8, md: 1 },
                  zIndex: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 3,
                  px: 1.5,
                  py: 1,
                }}
              >
                {shelterCards.slice(0, MAX_DOTS).map((_, index) => (
                  <Box
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                    sx={{
                      width: currentIndex === index ? { xs: 28, md: 32 } : { xs: 10, md: 12 },
                      height: { xs: 10, md: 12 },
                      borderRadius: { xs: 5, md: 6 },
                      bgcolor: currentIndex === index ? '#ff9800' : 'rgba(255, 152, 0, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: currentIndex === index ? '#ff5722' : 'rgba(255, 152, 0, 0.6)',
                      },
                    }}
                  />
                ))}
              </Box>
            );
          })()}
        </Box>
      </Container>
    </Box>
  );
};

export default SheltersSection;
