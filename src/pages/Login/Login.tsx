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
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

import api from '@/config/axiosConfig';
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
    const raw = (err.response?.data as any)?.message;
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
      const isAdminOrCoordinator =
        user.role === UserRole.ADMIN || user.role === UserRole.LEADER;

      const redirectPath = isAdminOrCoordinator ? '/adm' : '/area-do-membro';
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const isFormValid = (): boolean => {
    return isValidEmail(email) && isPasswordValid(password);
  };

  const bootstrapAfterLogin = async (accessToken: string): Promise<void> => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (error) {
    }

    try {
      await dispatch(fetchCurrentUser()).unwrap();
    } catch (error) {
    }
  };

  const getRedirectPath = (role: UserRole): string => {
    return role === UserRole.ADMIN ? '/adm' : '/area-do-membro';
  };

  const mapUserRole = (responseUser: any): any => {
    return {
      ...responseUser,
      role: responseUser.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.MEMBER,
    };
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
      const response = await api.post<LoginResponse>('/auth/login', { email, password });

      if (response.data.user.active === false) {
        handleUserInactive();

        if (response.data.emailVerification?.verificationEmailSent) {
          setEmailVerification(response.data.emailVerification);
        } else {
          setEmailVerification(null);
        }

        setLoading(false);
        return;
      }

      if (response.data.emailVerification?.verificationEmailSent) {
        setEmailVerification(response.data.emailVerification);
        dispatch(setEmailVerificationAlert(response.data.emailVerification));
      } else {
        setEmailVerification(null);
        dispatch(setEmailVerificationAlert(null));
      }

      const { accessToken, refreshToken, user: responseUser } = response.data;
      const mappedUser = mapUserRole(responseUser);
      dispatch(login({ accessToken, refreshToken, user: mappedUser, emailVerificationAlert: response.data.emailVerification }));
      await bootstrapAfterLogin(accessToken);

      const redirectPath = getRedirectPath(mappedUser.role);
      navigate(redirectPath);
    } catch (error) {
      const msg = mapLoginError(error);
      setErrorMessage(msg);
      setEmailVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any): Promise<void> => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const { credential } = credentialResponse;
      const res = await api.post('/auth/google', { token: credential });

      if (res.data.active === false) {
        handleUserInactive();
        return;
      }

      if (res.data.newUser) {
        if (res.data.name && res.data.email) {
          dispatch(setGoogleUser({ name: res.data.name, email: res.data.email }));
        }
        navigate('/cadastrar-google');
        return;
      }

      const { accessToken, refreshToken, user: responseUser } = res.data;
      const mappedUser = mapUserRole(responseUser);

      dispatch(login({ accessToken, refreshToken, user: mappedUser }));

      await bootstrapAfterLogin(accessToken);

      const redirectPath = getRedirectPath(mappedUser.role);
      navigate(redirectPath);
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
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            {emailVerification && emailVerification.verificationEmailSent && (
              <EmailVerificationAlert message={LOGIN_SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT} />
            )}

            <Box
              component="form"
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
                variant="outlined"
                error={!!errorMessage && !password}
                helperText={!!errorMessage && !password ? LOGIN_ERROR_MESSAGES.PASSWORD_REQUIRED : ''}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/esqueci-minha-senha')}
                  sx={{ textTransform: 'none', minWidth: 'auto', p: 0 }}
                >
                  Esqueci minha senha
                </Button>
              </Box>

              <Button
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

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleNavigateToRegister}
              sx={{ mt: 3, fontWeight: 'bold' }}
            >
              Cadastre-se
            </Button>
          </Paper>
        </Container>
      </Box>
    </GoogleOAuthProvider>
  );
};

export default Login;
