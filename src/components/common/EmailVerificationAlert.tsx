import React from 'react';
import { Alert, Button, Box, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface EmailVerificationAlertProps {
  message: string;
}

const EmailVerificationAlert: React.FC<EmailVerificationAlertProps> = ({ message }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Alert
      severity="info"
      sx={{
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        p: { xs: 1.5, md: 2 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          width: '100%',
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.9rem', md: '1rem' },
              display: 'block',
              mb: 0.5,
            }}
          >
            Verifique seu e-mail
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: { xs: '0.85rem', md: '0.95rem' },
              lineHeight: 1.4,
            }}
          >
            {message}
          </Box>
        </Box>

        <Button
          variant="contained"
          size={isMobile ? 'small' : 'medium'}
          onClick={() => navigate('/verificar-email')}
          sx={{
            whiteSpace: 'nowrap',
            flexShrink: 0,
            textTransform: 'none',
            fontWeight: 'bold',
            fontSize: { xs: '0.8rem', md: '0.9rem' },
            alignSelf: { xs: 'stretch', sm: 'center' },
          }}
        >
          VER INSTRUÇÕES
        </Button>
      </Box>
    </Alert>
  );
};

export default EmailVerificationAlert;
