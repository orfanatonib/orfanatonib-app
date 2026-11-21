import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

import { REGISTER_SUCCESS_MESSAGES } from '@/constants/errors';

interface RegisterSuccessProps {
  emailVerificationSent: boolean;
  onVerifyInstructions: () => void;
  onBackToLogin: () => void;
}

/** Tela mostrada depois do cadastro aceito pela API. */
const RegisterSuccess: React.FC<RegisterSuccessProps> = ({
  emailVerificationSent,
  onVerifyInstructions,
  onBackToLogin,
}) => (
  <Box
    data-testid="register-success-screen"
    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: 1, md: 2 }, gap: { xs: 2, md: 2.5 } }}
  >
    <Alert
      data-testid="register-success"
      severity="success"
      sx={{
        fontSize: { xs: '0.9rem', md: '1.1rem' },
        fontWeight: 'bold',
        p: { xs: 1.5, md: 2.5 },
        textAlign: 'center',
        borderRadius: 2,
        boxShadow: 2,
        width: '100%',
      }}
    >
      <Box sx={{ mb: { xs: 0.5, md: 1 }, fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
        {REGISTER_SUCCESS_MESSAGES.TITLE}
      </Box>
      <Box sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, fontWeight: 500, mt: 0.5 }}>
        {REGISTER_SUCCESS_MESSAGES.SUBTITLE}
      </Box>
      <Box sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, fontWeight: 500, mt: 0.5 }}>
        {REGISTER_SUCCESS_MESSAGES.NOTIFICATION}
      </Box>
    </Alert>

    {emailVerificationSent && (
      <Box
        data-testid="register-email-verification"
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.2, md: 1.5 },
          p: { xs: 1.5, md: 2.5 },
          backgroundColor: '#e3f2fd',
          borderRadius: 2,
          border: '1px solid #90caf9',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '0.85rem', md: '1rem' },
            textAlign: 'center',
            color: '#1565c0',
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          {REGISTER_SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT}
        </Typography>

        <Button
          data-testid="register-verify-instructions"
          variant="contained"
          color="info"
          fullWidth
          onClick={onVerifyInstructions}
          sx={{ py: { xs: 1, md: 1.2 }, fontWeight: 'bold', fontSize: { xs: '0.8rem', md: '0.95rem' }, textTransform: 'none' }}
        >
          Ver instruções de verificação
        </Button>
      </Box>
    )}

    <Button
      data-testid="register-back-to-login"
      variant="contained"
      color="primary"
      fullWidth
      onClick={onBackToLogin}
      sx={{ mt: { xs: 0.5, md: 1 }, py: { xs: 1.2, md: 1.5 }, fontWeight: 'bold', fontSize: { xs: '0.9rem', md: '1rem' } }}
    >
      Voltar para Login
    </Button>
  </Box>
);

export default RegisterSuccess;
