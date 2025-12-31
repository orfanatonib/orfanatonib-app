import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

import { RootState } from '@/store/slices';
import { MediaTargetType } from 'store/slices/types';

import './../styles/SheltersSection.css';

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

const FALLBACK_SHELTER_IMAGE = (import.meta as any).env?.VITE_SHELTER_FALLBACK_IMAGE_URL;


const SheltersSection: React.FC = () => {
  const navigate = useNavigate();
  const routes = useSelector((state: RootState) => state.routes.routes);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const shelterCards = useMemo(() => {
    return (routes || []).filter(
      (card: any) => card?.public && card?.entityType === MediaTargetType.ShelterPage
    ) as ShelterCard[];
  }, [routes]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
  }, [shelterCards.length]);

  const goToNext = useCallback(() => {
    if (shelterCards.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % shelterCards.length);
  }, [shelterCards.length]);

  const goToPrevious = useCallback(() => {
    if (shelterCards.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + shelterCards.length) % shelterCards.length);
  }, [shelterCards.length]);

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  useEffect(() => {
    if (shelterCards.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      goToNext();
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [shelterCards.length, isPaused, goToNext]);

  if (!shelterCards.length) return null;

  const currentCard = shelterCards[currentIndex];

  const imageSrc =
    currentCard?.image && currentCard.image.trim() ? currentCard.image : FALLBACK_SHELTER_IMAGE;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 1000 : -1000, opacity: 0 }),
  };

  return (
    <Box
      className="sheltersSection"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="sheltersSection__bg" />

      <Container maxWidth="xl" className="sheltersSection__container">
        <header className="sheltersSection__header">
          <div className="sheltersSection__titleRow">
            <HomeIcon className="sheltersSection__titleIcon" />
            <Typography variant="h2" component="h2" className="sheltersSection__title">
              Abrigos onde estamos presentes
            </Typography>
          </div>

          <Typography variant="body1" className="sheltersSection__subtitle">
            Levamos amor e o ensino da palavra de Deus para adultos, crianças e adolescentes do jeito
            que Jesus Cristo nos ensinou
          </Typography>
        </header>

        <section className="sheltersSection__carousel">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              className="sheltersSection__slide"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
              }}
            >
              <div
                className={[
                  'sheltersSection__card',
                  isAuthenticated ? 'is-clickable' : 'is-disabled',
                ].join(' ')}
                onClick={() => {
                  if (isAuthenticated) navigate(`/${currentCard.path}`);
                }}
                role={isAuthenticated ? 'button' : undefined}
                tabIndex={isAuthenticated ? 0 : -1}
                onKeyDown={(e) => {
                  if (!isAuthenticated) return;
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/${currentCard.path}`);
                }}
              >
                <div className="sheltersSection__media">
                  <img className="sheltersSection__img" src={imageSrc} alt={currentCard.title || 'Imagem do abrigo'} />
                  <div className="sheltersSection__mediaOverlay" />
                </div>

                <div className="sheltersSection__content">
                  <Typography variant="h3" className="sheltersSection__cardTitle">
                    {currentCard.title || 'Sem título'}
                  </Typography>

                  {currentCard.subtitle ? (
                    <div className="sheltersSection__location">
                      <LocationIcon className="sheltersSection__locationIcon" />
                      <Typography variant="h6" className="sheltersSection__locationText">
                        {currentCard.subtitle}
                      </Typography>
                    </div>
                  ) : null}

                  <Typography variant="body1" className="sheltersSection__description">
                    {currentCard.description ||
                      'Conheça mais sobre este abrigo e descubra como fazemos a diferença na vida das crianças.'}
                  </Typography>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {shelterCards.length > 1 ? (
            <>
              <IconButton className="sheltersSection__nav sheltersSection__nav--left" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}>
                <ChevronLeftIcon className="sheltersSection__navIcon" />
              </IconButton>

              <IconButton className="sheltersSection__nav sheltersSection__nav--right" onClick={(e) => { e.stopPropagation(); goToNext(); }}>
                <ChevronRightIcon className="sheltersSection__navIcon" />
              </IconButton>

              <div className="sheltersSection__dots">
                {(shelterCards.length <= 5 ? shelterCards : shelterCards.slice(0, 5)).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'sheltersSection__dot',
                      currentIndex === index ? 'is-active' : '',
                    ].join(' ')}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                    aria-label={`Ir para slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </Container>
    </Box>
  );
};

export default SheltersSection;
