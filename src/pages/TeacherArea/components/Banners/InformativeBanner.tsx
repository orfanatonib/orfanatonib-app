import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import Slider from 'react-slick';
import { motion } from 'framer-motion';
import { MediaTargetType } from 'store/slices/types';
import { RouteData } from 'store/slices/route/routeSlice';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { RootState } from '@/store/slices';

const colorThemes = [
  { 
    background: 'linear-gradient(135deg, #FF512F 0%, #F09819 25%, #DD2476 50%, #FF512F 100%)', 
    textColor: '#ffffff',
    glow: 'rgba(255, 81, 47, 0.4)'
  },
  { 
    background: 'linear-gradient(135deg, #FC466B 0%, #3F5EFB 25%, #667eea 50%, #764ba2 100%)', 
    textColor: '#ffffff',
    glow: 'rgba(252, 70, 107, 0.4)'
  },
  { 
    background: 'linear-gradient(135deg, #F7971E 0%, #FFD200 25%, #FFE082 50%, #FFC107 100%)', 
    textColor: '#000000',
    glow: 'rgba(247, 151, 30, 0.4)'
  },
  { 
    background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 25%, #667eea 50%, #764ba2 100%)', 
    textColor: '#ffffff',
    glow: 'rgba(142, 45, 226, 0.4)'
  },
  { 
    background: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 25%, #00F260 50%, #0575E6 100%)', 
    textColor: '#000000',
    glow: 'rgba(0, 201, 255, 0.4)'
  },
];

const InformativeBanner: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [maxHeight, setMaxHeight] = useState({ mobile: 260, desktop: 300 });

  const routes = useSelector((state: RootState) => state.routes.routes) as RouteData[];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const informativeRoutes = useMemo(
    () =>
      routes.filter(
        (route) =>
          route.entityType === MediaTargetType.Informative && route.public === true
      ),
    [routes]
  );

  useEffect(() => {
    if (informativeRoutes.length === 0) return;

    const heights = informativeRoutes.map((route) => {
      const content = (route.title || '') + (route.subtitle || '');
      const charCount = content.length;

      const mobileHeight = Math.min(220 + charCount * 0.4, 350);
      const desktopHeight = Math.min(300 + charCount * 0.3, 350);

      return { mobile: mobileHeight, desktop: desktopHeight };
    });

    const maxMobileHeight = Math.max(...heights.map((h) => h.mobile), 220);
    const maxDesktopHeight = Math.max(...heights.map((h) => h.desktop), 300);

    setMaxHeight({ mobile: maxMobileHeight, desktop: maxDesktopHeight });
  }, [informativeRoutes]);

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    fade: true,
    cssEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
    beforeChange: (_: number, next: number) => setActiveSlide(next),
  };

  const renderBanner = (route: RouteData, index: number) => {
    const theme = colorThemes[index % colorThemes.length];

    return (
      <motion.div
        key={`${route.id}-${activeSlide}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: isMobile ? `${maxHeight.mobile}px` : `${maxHeight.desktop}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Box
          sx={{
            background: theme.background,
            backgroundSize: '200% 200%',
            animation: 'gradientShift 8s ease infinite',
            color: theme.textColor,
            padding: { xs: 2.5, sm: 3, md: 5 },
            borderRadius: { xs: 2, md: 4 },
            boxShadow: { 
              xs: `0 8px 24px ${theme.glow}, 0 4px 12px rgba(0, 0, 0, 0.25)`,
              md: `0 16px 48px ${theme.glow}, 0 8px 24px rgba(0, 0, 0, 0.3)`
            },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%', 
            textAlign: 'center',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
            transition: { md: 'transform 0.3s ease, box-shadow 0.3s ease' },
            '&:hover': {
              transform: { xs: 'none', md: 'translateY(-4px)' },
              boxShadow: { 
                xs: `0 8px 24px ${theme.glow}, 0 4px 12px rgba(0, 0, 0, 0.25)`,
                md: `0 20px 56px ${theme.glow}, 0 12px 32px rgba(0, 0, 0, 0.4)`
              },
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: { xs: -30, md: -50 },
              right: { xs: -30, md: -50 },
              width: { xs: 120, md: 220 },
              height: { xs: 120, md: 220 },
              background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'pulse 5s ease-in-out infinite',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: { xs: -25, md: -40 },
              left: { xs: -25, md: -40 },
              width: { xs: 100, md: 180 },
              height: { xs: 100, md: 180 },
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'pulse 5s ease-in-out infinite 2.5s',
            },
            '@keyframes pulse': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 0.6,
              },
              '50%': {
                transform: 'scale(1.15)',
                opacity: 0.9,
              },
            },
            '@keyframes gradientShift': {
              '0%': {
                backgroundPosition: '0% 50%',
              },
              '50%': {
                backgroundPosition: '100% 50%',
              },
              '100%': {
                backgroundPosition: '0% 50%',
              },
            },
          }}
        >
          <Box sx={{ 
            maxWidth: { xs: '100%', md: '90%' }, 
            width: '100%', 
            position: 'relative', 
            zIndex: 1,
            px: { xs: 0.5, md: 0 }
          }}>
            <motion.div
              key={`info-${activeSlide}`}
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 1.5, md: 2 }, 
                mb: { xs: 2, md: 3 }
              }}>
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                >
                  <Box
                    sx={{
                      p: { xs: 1, md: 1.5 },
                      borderRadius: { xs: 2, md: 3 },
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.2) 100%)',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.5rem' },
                        lineHeight: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      }}
                    >
                      ⚠️
                    </Typography>
                  </Box>
                </motion.div>
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.2rem', md: '2.4rem' },
                    fontWeight: 900,
                    letterSpacing: { xs: '1.5px', sm: '2px', md: '4px' },
                    textTransform: 'uppercase',
                    display: 'block',
                    textShadow: { 
                      xs: '2px 2px 6px rgba(0, 0, 0, 0.7)',
                      md: '3px 3px 12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255,255,255,0.3)'
                    },
                    lineHeight: { xs: 1.4, md: 1.2 },
                    textAlign: 'center',
                  }}
                >
                  INFORMAÇÃO IMPORTANTE!
                </Typography>
              </Box>
            </motion.div>

            <motion.div
              key={`text-${activeSlide}`}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            >
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontSize: { xs: '1.3rem', sm: '1.5rem', md: '2.1rem' },
                  fontWeight: 800,
                  textShadow: { 
                    xs: '2px 2px 6px rgba(0, 0, 0, 0.7)',
                    md: '3px 3px 10px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255,255,255,0.2)'
                  },
                  mb: { xs: 2, md: 3 },
                  lineHeight: { xs: 1.4, md: 1.4 },
                  letterSpacing: { xs: '0.3px', md: '0.5px' },
                  px: { xs: 0.5, md: 0 },
                }}
              >
                {route.title}
              </Typography>

              {route.subtitle && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.4rem' },
                      fontWeight: { xs: 600, md: 600 },
                      textShadow: { 
                        xs: '1px 1px 4px rgba(0, 0, 0, 0.6)',
                        md: '2px 2px 8px rgba(0, 0, 0, 0.6), 0 0 10px rgba(255,255,255,0.15)'
                      },
                      lineHeight: { xs: 1.5, md: 1.6 },
                      letterSpacing: { xs: '0.2px', md: '0.3px' },
                      maxWidth: { xs: '100%', md: '90%' },
                      mx: 'auto',
                      px: { xs: 0.5, md: 0 },
                    }}
                  >
                    {route.subtitle}
                  </Typography>
                </motion.div>
              )}
            </motion.div>
          </Box>
        </Box>
      </motion.div>
    );
  };

  if (informativeRoutes.length === 0) return null;

  if (informativeRoutes.length === 1) {
    return (
      <Box
        sx={{
          height: isMobile ? `${maxHeight.mobile}px` : `${maxHeight.desktop}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderBanner(informativeRoutes[0], 0)}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: { xs: 220, md: 300 },
      width: '100%',
      mx: 'auto',
    }}>
      <Slider {...carouselSettings}>
        {informativeRoutes.map((route, index) => (
          <div key={route.id}>{renderBanner(route, index)}</div>
        ))}
      </Slider>
    </Box>
  );
};

export default InformativeBanner;