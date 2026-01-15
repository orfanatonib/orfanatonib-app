import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/slices';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { MediaTargetType } from '@/store/slices/types';
import { motion } from 'framer-motion';

const MemberWeekBanner: React.FC = () => {
  return null;

  const routes = useSelector((state: RootState) => state.routes.routes);
  const { user } = useSelector((state: RootState) => state.auth);
  const currentVisitRoute = routes.find(
    (route) => route.entityType === MediaTargetType.VisitMaterialsPage && route.current === true
  );

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

  if (!currentVisitRoute) {
    return (
      <Paper
        elevation={3}
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
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: { xs: '5px', sm: 3, md: '16px' },
          borderRadius: { xs: 2, md: 3 },
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'text.secondary',
            fontSize: { xs: '1rem', md: '1.1rem' },
            fontWeight: 500,
          }}
        >
          Nenhum material de visita atual encontrado.
        </Typography>
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
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 25%, #42a5f5 50%, #64b5f6 75%, #90caf9 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(25, 118, 210, 0.35)',
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
          maxWidth: { xs: '100%', md: '600px' },
        }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.3rem' },
              fontWeight: 500,
              mb: { xs: 0.75, md: 1 },
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
            }}
          >
            Olá {user?.name || 'Membro'}, estamos na {part} do mês de:
          </Typography>

          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              color: '#fff',
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '3rem' },
              mb: { xs: 1.5, md: 2 },
              textShadow: '2px 2px 6px rgba(0, 0, 0, 0.4)',
              lineHeight: 1.2,
            }}
          >
            {month}
          </Typography>

          {currentVisitRoute?.subtitle && (
            <Fragment>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1.2rem' },
                  mb: { xs: 0.75, md: 1 },
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
                  opacity: 0.95,
                }}
              >
                Com o tema:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: { xs: 500, md: 700 },
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.5rem' },
                  mb: { xs: 2, md: 3 },
                  textShadow: { xs: '1px 1px 3px rgba(0, 0, 0, 0.3)', md: '2px 2px 8px rgba(0, 0, 0, 0.6)' },
                  opacity: 0.95,
                }}
              >
                {currentVisitRoute?.subtitle}
              </Typography>
            </Fragment>
          )}

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="medium"
              component={Link}
              to="/lista-materias-visita"
              sx={{
                bgcolor: 'white',
                color: '#1976d2',
                fontWeight: 700,
                px: { xs: 2.5, sm: 3, md: 5 },
                py: { xs: 1, sm: 1.25, md: 2 },
                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1.1rem' },
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.95)',
                  transform: { xs: 'none', md: 'translateY(-3px)' },
                  boxShadow: { xs: '0 4px 16px rgba(0,0,0,0.2)', md: '0 8px 24px rgba(0,0,0,0.35)' },
                },
                transition: 'all 0.3s ease',
                minWidth: { xs: '120px', sm: '140px', md: '160px' },
              }}
            >
              Saber mais
            </Button>
          </motion.div>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default MemberWeekBanner;