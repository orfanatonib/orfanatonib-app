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
  return password.length >= 6;
};

const mapLoginError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const raw = (err.response?.data as any)?.message;
    const serverMsg = Array.isArray(raw) ? raw.join(' ') : String(raw ?? '');

    if (status === 401) {
      return 'Email ou senha inválidos.';
    }

    if (/user.*inactive|blocked|disabled/i.test(serverMsg)) {
      return 'Usuário inativo ou sem permissão.';
    }

    if (serverMsg) {
      return serverMsg;
    }

    return 'Erro inesperado. Tente novamente mais tarde.';
  }

  return 'Erro inesperado. Tente novamente mais tarde.';
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
    setErrorMessage(
      'Usuário não validado, entre em contato com (61) 8254-9780 ou (92) 98155-3139'
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!isFormValid()) {
      setErrorMessage(
        'Por favor, insira um email válido e uma senha com pelo menos 6 caracteres.'
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setEmailVerification(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });

      console.log('Login response:', response.data);

      if (response.data.user.active === false) {
        handleUserInactive();

        if (response.data.emailVerification?.verificationEmailSent) {
          console.log('Email verification detected for inactive user:', response.data.emailVerification);
          setEmailVerification(response.data.emailVerification);
        } else {
          setEmailVerification(null);
        }

        setLoading(false);
        return;
      }

      if (response.data.emailVerification?.verificationEmailSent) {
        console.log('Email verification detected:', response.data.emailVerification);
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
    setErrorMessage('Erro ao fazer login com Google. Tente novamente.');
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
              <EmailVerificationAlert message="Seu email ainda não foi verificado. Verifique sua caixa de entrada." />
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
                helperText={!!errorMessage && !email ? 'Email é obrigatório' : ''}
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
                helperText={!!errorMessage && !password ? 'Senha é obrigatória' : ''}
              />

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
