import React from 'react';
import { Box, Typography, Button, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share } from '@mui/icons-material';
import { BANNER_STYLES } from '../../constants';

interface IdeasSharingBannerProps {
  variant?: 'full' | 'compact';
  forceColumnLayout?: boolean;
}

const IdeasSharingBanner: React.FC<IdeasSharingBannerProps> = ({ variant = 'full', forceColumnLayout = false }) => {

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isCompact = variant === 'compact';

  const shouldUseColumnLayout = isMobile || !forceColumnLayout;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box
        component="section"
        sx={{
          ...BANNER_STYLES.ideasSharing,
          display: 'flex',
          flexDirection: shouldUseColumnLayout ? 'column' : 'row',
          alignItems: shouldUseColumnLayout ? 'center' : 'stretch',
          justifyContent: 'space-between',
          gap: shouldUseColumnLayout ? 3 : 0,
          width: '100%',
          mx: 'auto',
          px: isCompact ? { xs: 2, sm: 4, md: 4 } : { xs: 2, sm: 5, md: 5 },
          py: isCompact ? { xs: 2, sm: 3, md: 3 } : { xs: 2.5, sm: 6, md: 6 },
          mb: isCompact ? 0 : 0,
          mt: isCompact ? 0 : 0,
          position: 'relative',
          overflow: 'hidden',
          height: isMobile
            ? { xs: 'auto', sm: 'auto', md: 'auto' }
            : { xs: 'auto', sm: 'auto', md: shouldUseColumnLayout ? 350 : 200 },
          minHeight: isMobile
            ? { xs: 400, sm: 400, md: 400 }
            : { xs: 400, sm: shouldUseColumnLayout ? 300 : 200, md: shouldUseColumnLayout ? 280 : 200 },
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            flex: isCompact ? 1 : 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: shouldUseColumnLayout ? 'center' : 'flex-start',
            textAlign: shouldUseColumnLayout ? 'center' : 'left',
            px: isCompact ? { xs: 1, md: 0 } : { xs: 1, sm: 3, md: 4 },
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              fontSize: isCompact ? { xs: '1.1rem', sm: '1.2rem', md: '1.6rem' } : { xs: '1.4rem', sm: '1.7rem', md: '2.2rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              mb: { xs: 1.5, md: 2 },
              lineHeight: { xs: 1.4, md: 1.3 },
              letterSpacing: { xs: '0.2px', md: '0.3px' },
            }}
          >
            Compartilhe a Inspiração que Deus Te Deu!
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: isCompact ? { xs: '0.9rem', sm: '1rem', md: '1.15rem' } : { xs: '1.05rem', sm: '1.15rem', md: '1.35rem' },
              maxWidth: isCompact ? '800px' : '800px',
              lineHeight: { xs: 1.6, md: 1.6 },
              fontWeight: { xs: 500, md: 500 },
              mb: 0,
              letterSpacing: { xs: '0.1px', md: '0.2px' },
            }}
          >
            Criou uma brincadeira incrível ou descobriu uma forma especial de contar uma história bíblica?
            <br />
            Compartilhe sua criatividade com outros professores! Sua ideia pode transformar vidas!
          </Typography>

        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            position: 'relative',
            zIndex: 1,
            px: isCompact ? 0 : 2,
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="medium"
              onClick={() => navigate('/compartilhar-ideia')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: { xs: 2.5, sm: 3, md: 5 },
                py: { xs: 1, sm: 1.25, md: 2.25 },
                fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.3rem' },
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.95)',
                  transform: { xs: 'none', md: 'translateY(-4px)' },
                  boxShadow: { xs: '0 4px 16px rgba(0,0,0,0.2)', md: '0 12px 40px rgba(0,0,0,0.35)' },
                },
                transition: 'all 0.3s ease',
                minWidth: { xs: '140px', sm: '160px', md: '200px' },
                width: { xs: 'auto', md: '100%' },
              }}
              endIcon={
                <Share
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.4rem' }
                  }}
                />
              }
            >
              Compartilhar Ideia
            </Button>
          </motion.div>

          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.9rem' },
              maxWidth: { xs: '100%', md: '200px' },
              mt: { xs: 0.5, md: 0 },
            }}
          >
            Clique aqui para começar!
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

export default IdeasSharingBanner;