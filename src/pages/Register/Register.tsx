import React from 'react';
import { Alert, Box, Container, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { REGISTER_TITLES } from '@/features/auth/register.constants';
import type { RegisterProps } from '@/features/auth/register.types';
import { useRegisterForm } from '@/features/auth/useRegisterForm';

import RegisterForm from './RegisterForm';
import RegisterSuccess from './RegisterSuccess';

const Register: React.FC<RegisterProps> = ({ commonUser }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const form = useRegisterForm(commonUser);

  const goToLogin = (): void => {
    void navigate('/login');
  };

  return (
    <Box data-testid="register-page" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box component="main" sx={{ flex: '1 0 auto' }}>
        <Container maxWidth="sm" sx={{ pt: { xs: 15, md: 15 }, pb: { xs: 5, md: 0 } }}>
          <Paper elevation={3} sx={{ p: { xs: 2.25, md: 4 }, borderRadius: 2, backgroundColor: '#fff' }}>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h1"
              gutterBottom
              align="center"
              sx={{ fontWeight: 700 }}
            >
              {commonUser ? REGISTER_TITLES.common : REGISTER_TITLES.complete}
            </Typography>

            {form.globalError && (
              <Alert data-testid="register-error" severity="error" sx={{ mb: 2 }}>
                {form.globalError}
              </Alert>
            )}

            {form.success ? (
              <RegisterSuccess
                emailVerificationSent={form.emailVerificationSent}
                onVerifyInstructions={() => {
                  void navigate('/verificar-email');
                }}
                onBackToLogin={goToLogin}
              />
            ) : (
              <RegisterForm
                commonUser={commonUser}
                control={form.control}
                errors={form.errors}
                setValue={form.setValue}
                onSubmit={form.submit}
                onBackToLogin={goToLogin}
                loading={form.loading}
                isValid={form.isValid}
                isMemberSelected={form.isMemberSelected}
                teams={form.teams}
                loadingTeams={form.loadingTeams}
              />
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;
