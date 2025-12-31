import React from 'react';
import { gradients } from '@/theme';
import { Box, Container, Typography, useTheme } from '@mui/material';

interface AboutLayoutProps {
  children: React.ReactNode;
}

const AboutLayout: React.FC<AboutLayoutProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100vh - 128px)',
        background: gradients.subtle.greenWhiteSoft,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(240, 147, 251, 0.1) 0%, transparent 50%)',
          zIndex: 0,
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 2, sm: 3, md: 6 },
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 3, sm: 4, md: 6 },
            px: { xs: 1, sm: 2 },
          }}
        >
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem', lg: '3rem' }, fontWeight: 800, color: '#000000', fontFamily: "'Poppins', sans-serif", mb: { xs: 1.5, sm: 2 }, lineHeight: 1.2, }} >
            Sobre o Orfanatos NIB
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#000000',
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
              fontWeight: 500,
              maxWidth: { xs: '100%', sm: 500, md: 600 },
              mx: 'auto',
              lineHeight: 1.5,
              px: { xs: 1, sm: 0 },
            }}
          >
            Conhecendo nossa missão de levar o amor de Cristo às crianças
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(auto-fit, minmax(300px, 1fr))' },
            gap: { xs: 2, sm: 3, md: 4 },
            alignItems: 'start',
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
};

export default AboutLayout;
