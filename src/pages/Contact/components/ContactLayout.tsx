import React from 'react';
import { gradients } from '@/theme';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';

interface ContactLayoutProps {
  children: React.ReactNode;
}

const ContactLayout: React.FC<ContactLayoutProps> = ({ children }) => {
  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100vh - 128px)',
        background: gradients.subtle.greenWhiteSoft,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 2, sm: 3, md: 2 },
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
          <Typography
            variant="h2"
            component="h1"
             sx={{
               fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem', lg: '3rem' },
               fontWeight: 800,
               color: '#000000',
               fontFamily: "'Poppins', sans-serif",
               mb: { xs: 1.5, sm: 2 },
               lineHeight: 1.2,
             }}
          >
            Fale Conosco
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
            Entre em contato para saber mais informações sobre o Orfanatos NIB
          </Typography>
        </Box>

        <Card
          sx={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 153, 51, 0.2)',
            borderRadius: 4,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 20px 40px rgba(0, 153, 51, 0.15)',
              border: '1px solid rgba(0, 153, 51, 0.4)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: gradients.subtle.greenWhiteDiagonal,
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {children}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ContactLayout;
