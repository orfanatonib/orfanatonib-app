import React, { useState, useEffect } from 'react';
import { EmailVerificationAlert } from '@/components/common';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import axios from 'axios';

import api from '@/config/axiosConfig';
import { apiGoogleLogin, apiLogin } from '@/features/auth/api';
import { useAuthEntryOptions } from '@/features/auth/entryOptions';
import { landingPathFor } from '@/features/auth/landing';
import { logger } from '@/utils/logger';
import { RootState as RootStateType, AppDispatch as AppDispatchType } from '@/store/slices';
import { LOGIN_ERROR_MESSAGES, LOGIN_SUCCESS_MESSAGES, LOGIN_VALIDATION } from '@/constants/errors';
import {
  login,
  LoginResponse,
  UserRole,
  setGoogleUser,
  fetchCurrentUser,
  setEmailVerificationAlert,
} from '@/store/slices/auth/authSlice';
import { isValidEmail } from '@/utils/validators';

const isPasswordValid = (password: string): boolean => {
  return password.length >= LOGIN_VALIDATION.MIN_PASSWORD_LENGTH;
};

const mapLoginError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const raw = (err.response?.data as { message?: unknown } | undefined)?.message;
    const serverMsg = Array.isArray(raw) ? raw.join(' ') : String(raw ?? '');

    if (status === 401) {
      return LOGIN_ERROR_MESSAGES.INVALID_CREDENTIALS;
    }

    if (/user.*inactive|blocked|disabled/i.test(serverMsg)) {
      return LOGIN_ERROR_MESSAGES.USER_INACTIVE;
    }

    if (serverMsg) {
      return serverMsg;
    }

    return LOGIN_ERROR_MESSAGES.UNEXPECTED_ERROR;
  }

  return LOGIN_ERROR_MESSAGES.UNEXPECTED_ERROR;
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailVerification, setEmailVerification] = useState<{ verificationEmailSent: boolean; message?: string } | null>(null);
  const dispatch = useDispatch<AppDispatchType>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, user } = useSelector((state: RootStateType) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(landingPathFor(user.role));
    }
  }, [isAuthenticated, user, navigate]);

  const isFormValid = (): boolean => {
    return isValidEmail(email) && isPasswordValid(password);
  };

  const bootstrapAfterLogin = async (accessToken: string): Promise<void> => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (error: unknown) {
      logger.warn('Não foi possível aplicar o cabeçalho de autorização', { feature: 'login' }, error);
    }

    try {
      await dispatch(fetchCurrentUser()).unwrap();
    } catch (error: unknown) {
      // O login já deu certo; a sessão completa é recarregada na próxima navegação.
      logger.warn('Não foi possível carregar o usuário logo após o login', { feature: 'login' }, error);
    }
  };

  const handleUserInactive = (): void => {
    setErrorMessage(LOGIN_ERROR_MESSAGES.USER_NOT_VALIDATED);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!isFormValid()) {
      setErrorMessage(LOGIN_ERROR_MESSAGES.INVALID_FORM);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setEmailVerification(null);

    try {
      const loginData = await apiLogin(email, password);

      if (loginData.user.active === false) {
        handleUserInactive();

        if (loginData.emailVerification?.verificationEmailSent) {
          setEmailVerification(loginData.emailVerification);
        } else {
          setEmailVerification(null);
        }

        setLoading(false);
        return;
      }

      if (loginData.emailVerification?.verificationEmailSent) {
        setEmailVerification(loginData.emailVerification);
        dispatch(setEmailVerificationAlert(loginData.emailVerification));
      } else {
        setEmailVerification(null);
        dispatch(setEmailVerificationAlert(null));
      }

      const { accessToken, refreshToken, user: responseUser } = loginData;
      dispatch(login({ accessToken, refreshToken, user: responseUser, emailVerificationAlert: loginData.emailVerification }));
      await bootstrapAfterLogin(accessToken);

      navigate(landingPathFor(responseUser.role));
    } catch (error) {
      const msg = mapLoginError(error);
      setErrorMessage(msg);
      setEmailVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { credential } = credentialResponse;
      if (!credential) throw new Error('Credencial do Google ausente');
      const res = { data: await apiGoogleLogin(credential) };

      if (res.data.active === false) {
        handleUserInactive();
        return;
      }

      if (res.data.newUser) {
        if (res.data.name && res.data.email) {
          dispatch(
            setGoogleUser({
              name: res.data.name,
              email: res.data.email,
              completionToken: res.data.completionToken,
            }),
          );
        }
        navigate('/cadastrar-google');
        return;
      }

      const { accessToken, refreshToken, user: responseUser } = res.data;
      if (!accessToken || !refreshToken || !responseUser) throw new Error('Resposta de login do Google incompleta');

      dispatch(login({ accessToken, refreshToken, user: responseUser }));

      await bootstrapAfterLogin(accessToken);

      navigate(landingPathFor(responseUser.role));
    } catch (error) {
      const msg = mapLoginError(error);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (): void => {
    setErrorMessage(LOGIN_ERROR_MESSAGES.GOOGLE_LOGIN_ERROR);
  };

  const { canRegister, canRecoverPassword, canUseGoogle } = useAuthEntryOptions();

  const handleNavigateToRegister = (): void => {
    navigate('/cadastrar');
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <Box
        sx={{
          minHeight: 'calc(100vh - var(--app-header-h, 64px))',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pt: { xs: 10, md: 15 },
          pb: { xs: 0, md: 0 },
          px: 2,
        }}
      >
        <Container maxWidth="sm" disableGutters sx={{ width: '100%', maxWidth: 560 }}>
          <Paper
            data-testid="login-page"
            elevation={3}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              boxShadow: 3,
              backgroundColor: '#fff',
            }}
          >
            <Typography variant="h5" component="h1" gutterBottom align="center">
              Área do Membro
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }} data-testid="login-error">
                {errorMessage}
              </Alert>
            )}

            {emailVerification && emailVerification.verificationEmailSent && (
              <EmailVerificationAlert message={LOGIN_SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT} />
            )}

            <Box
              component="form"
              data-testid="login-form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                aria-label="Digite seu email"
                inputProps={{ 'data-testid': 'login-email' }}
                variant="outlined"
                error={!!errorMessage && !email}
                helperText={!!errorMessage && !email ? LOGIN_ERROR_MESSAGES.EMAIL_REQUIRED : ''}
              />

              <TextField
                fullWidth
                type="password"
                label="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                aria-label="Digite sua senha"
                inputProps={{ 'data-testid': 'login-password' }}
                variant="outlined"
                error={!!errorMessage && !password}
                helperText={!!errorMessage && !password ? LOGIN_ERROR_MESSAGES.PASSWORD_REQUIRED : ''}
              />

              {canRecoverPassword && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    data-testid="login-forgot-password"
                    variant="text"
                    size="small"
                    onClick={() => navigate('/esqueci-minha-senha')}
                    sx={{ textTransform: 'none', minWidth: 'auto', p: 0 }}
                  >
                    Esqueci minha senha
                  </Button>
                </Box>
              )}

              <Button
                data-testid="login-submit"
                type="submit"
                variant="contained"
                fullWidth
                size={isMobile ? 'medium' : 'large'}
                disabled={loading || !isFormValid()}
                sx={{ mt: 1 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
              </Button>
            </Box>

            {canUseGoogle && (
              <Box data-testid="login-google" sx={{ mt: 2, textAlign: 'center' }}>
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
              </Box>
            )}

            {canRegister && (
              <Button
                data-testid="login-register"
                variant="outlined"
                fullWidth
                onClick={handleNavigateToRegister}
                sx={{ mt: 3, fontWeight: 'bold' }}
              >
                Cadastre-se
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    </GoogleOAuthProvider>
  );
};

export default Login;
