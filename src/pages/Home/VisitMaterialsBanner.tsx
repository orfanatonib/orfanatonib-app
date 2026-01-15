import React from 'react';
import { gradients } from '@/theme';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/slices';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MediaTargetType } from '@/store/slices/types';

const VisitMaterialsBanner: React.FC = () => {
  return null;

  const routes = useSelector((state: RootState) => state.routes.routes);
  const { user } = useSelector((state: RootState) => state.auth);
  const currentVisitRoute = routes.find(
    (route) => route.entityType === MediaTargetType.VisitMaterialsPage && route.current === true
  );

  if (!currentVisitRoute) return null;

  const getMonthPart = () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthName = monthNames[today.getMonth()];
    const isFirstHalf = dayOfMonth <= 15;

    return {
      part: isFirstHalf ? 'primeira parte' : 'segunda parte',
      month: monthName
    };
  };

  const { part, month } = getMonthPart();

  return (
    <Box
      sx={{
        width: '100%',
        py: { xs: 6, md: 10 },
        background: gradients.special.banner,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 0, md: 0 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(205, 220, 57, 0.1) 0%, transparent 50%)',
          zIndex: 0,
          borderRadius: 'inherit',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to top, transparent 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.25) 100%)',
          zIndex: 2,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)',
          clipPath: 'polygon(0 0%, 0 40%, 25% 60%, 50% 40%, 75% 70%, 100% 50%, 100% 0%)',
          zIndex: 1,
        }}
        animate={{
          clipPath: [
            'polygon(0 0%, 0 40%, 25% 60%, 50% 40%, 75% 70%, 100% 50%, 100% 0%)',
            'polygon(0 0%, 0 50%, 25% 40%, 50% 60%, 75% 50%, 100% 40%, 100% 0%)',
            'polygon(0 0%, 0 30%, 25% 70%, 50% 30%, 75% 60%, 100% 60%, 100% 0%)',
            'polygon(0 0%, 0 40%, 25% 60%, 50% 40%, 75% 70%, 100% 50%, 100% 0%)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 3,
          px: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#FFFFFF',
              mb: 2,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              fontWeight: 400,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            Olá {user?.name || 'Membro'}, estamos na {part} do mês de:
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Typography
            variant="h1"
            sx={{
              color: '#FFFFFF',
              mb: 3,
              fontSize: { xs: '2.2rem', md: '3.5rem', lg: '4rem' },
              fontWeight: 800,
              textShadow: '0 4px 8px rgba(0,0,0,0.8)',
              fontFamily: "'Poppins', sans-serif",
              lineHeight: 1.2,
            }}
          >
            {month}
          </Typography>
        </motion.div>

        {currentVisitRoute?.subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Typography
              variant="h5"
              sx={{
                color: '#FFFFFF',
                mb: 2,
                fontSize: { xs: '1rem', md: '1.3rem' },
                fontWeight: 400,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              Com o tema:
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: '#FFFFFF',
                mb: 4,
                fontSize: { xs: '1.1rem', md: '1.4rem' },
                fontWeight: 600,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {currentVisitRoute?.subtitle}
            </Typography>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/lista-materias-visita"
              sx={{
                px: { xs: 4, md: 6 },
                py: { xs: 2, md: 2.5 },
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 700,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2d8650 0%, #4caf50 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(45, 134, 80, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a5f2e 0%, #2d8650 100%)',
                  boxShadow: '0 6px 16px rgba(45, 134, 80, 0.6)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Saber mais
            </Button>
          </motion.div>
        </motion.div>
      </Container>
      
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.25) 100%)',
          zIndex: 2,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)',
          clipPath: 'polygon(0 100%, 0 60%, 25% 40%, 50% 60%, 75% 30%, 100% 50%, 100% 100%)',
          zIndex: 1,
        }}
        animate={{
          clipPath: [
            'polygon(0 100%, 0 60%, 25% 40%, 50% 60%, 75% 30%, 100% 50%, 100% 100%)',
            'polygon(0 100%, 0 50%, 25% 60%, 50% 40%, 75% 50%, 100% 60%, 100% 100%)',
            'polygon(0 100%, 0 70%, 25% 30%, 50% 70%, 75% 40%, 100% 40%, 100% 100%)',
            'polygon(0 100%, 0 60%, 25% 40%, 50% 60%, 75% 30%, 100% 50%, 100% 100%)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </Box>
  );
};

export default VisitMaterialsBanner;