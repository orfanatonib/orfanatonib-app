import React, { Fragment, useEffect, useState } from 'react';
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
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import axios from 'axios';
import { useSelector } from 'react-redux';

import api from '@/config/axiosConfig';
import { RootState } from '@/store/slices';
import { digitsOnly, maskPhoneBR } from '@/utils/masks';
import { isValidEmail, normalizeEmail } from '@/utils/validators';

interface RegisterProps {
  commonUser: boolean;
}

type RoleChoice = '' | 'member' | 'leader';

interface FormData {
  name: string;
  email: string;
  confirmEmail?: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  role: RoleChoice;
}

interface GoogleUserCache {
  name: string;
  email: string;
  timestamp: number;
}

const GOOGLE_USER_CACHE_KEY = 'google_user_register_cache';
const CACHE_DURATION = 30 * 60 * 1000;

const MESSAGES = {
  SUCCESS: {
    TITLE: 'Cadastro concluído com sucesso!',
    SUBTITLE: 'Aguarde a aprovação do seu cadastro.',
    NOTIFICATION: 'Você será notificado pelo WhatsApp.',
  },
  ERROR: {
    GENERIC: 'Erro ao cadastrar. Tente novamente.',
    UNEXPECTED: 'Erro inesperado. Tente novamente mais tarde.',
  },
} as const;


const getSchema = (commonUser: boolean) =>
  Yup.object({
    name: Yup.string()
      .required('Nome é obrigatório')
      .min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: Yup.string()
      .required('Email é obrigatório')
      .test('valid-email', 'Email inválido', (val) => isValidEmail(val)),
    ...(commonUser && {
      confirmEmail: Yup.string()
        .required('Confirme o email')
        .test('emails-match', 'Os emails não coincidem', function (val) {
          const email = (this.parent as any)?.email;
          return normalizeEmail(val) === normalizeEmail(email);
        }),
      password: Yup.string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres')
        .required('Senha obrigatória'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'As senhas não coincidem')
        .required('Confirme a senha'),
    }),
    phone: Yup.string()
      .test('len', 'Telefone inválido (DDD + número)', (val) => {
        const digits = digitsOnly(val);
        if (digits.startsWith("55")) return digits.length === 12 || digits.length === 13;
        return digits.length === 10 || digits.length === 11;
      })
      .required('Telefone é obrigatório'),
    role: (Yup.mixed<RoleChoice>()
      .oneOf(['member', 'leader'])
      .required('Selecione seu perfil')) as any,
  });


const cacheGoogleUser = (name: string, email: string): void => {
  try {
    const cache: GoogleUserCache = {
      name,
      email,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(GOOGLE_USER_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving Google cache:', error);
  }
};

const getGoogleUserCache = (): GoogleUserCache | null => {
  try {
    const cached = sessionStorage.getItem(GOOGLE_USER_CACHE_KEY);
    if (!cached) return null;

    const cache: GoogleUserCache = JSON.parse(cached);

    const isExpired = Date.now() - cache.timestamp > CACHE_DURATION;
    if (isExpired) {
      sessionStorage.removeItem(GOOGLE_USER_CACHE_KEY);
      return null;
    }

    return cache;
  } catch (error) {
    console.error('Error reading Google cache:', error);
    return null;
  }
};


const clearGoogleUserCache = (): void => {
  try {
    sessionStorage.removeItem(GOOGLE_USER_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing Google cache:', error);
  }
};

const mapApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || MESSAGES.ERROR.GENERIC;
  }
  return MESSAGES.ERROR.UNEXPECTED;
};

const Register: React.FC<RegisterProps> = ({ commonUser }) => {

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const googleUser = useSelector((state: RootState) => state.auth.googleUser);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: yupResolver(getSchema(commonUser)) as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      confirmEmail: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: '',
    },
  });

  useEffect(() => {
    if (!commonUser) {
      if (googleUser?.email || googleUser?.name) {
        if (googleUser.email) setValue('email', googleUser.email);
        if (googleUser.name) setValue('name', googleUser.name);
        if (googleUser.email && googleUser.name) {
          cacheGoogleUser(googleUser.name, googleUser.email);
        }
        return;
      }

      const cached = getGoogleUserCache();
      if (cached) {
        setValue('email', cached.email);
        setValue('name', cached.name);
      }
    }
  }, [googleUser, commonUser, setValue]);


  useEffect(() => {
    if (success && !commonUser) {
      clearGoogleUserCache();
    }
  }, [success, commonUser]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    setGlobalError(null);

    const endpoint = commonUser ? '/auth/register' : '/auth/complete-register';

    try {
      const response = await api.post(endpoint, {
        name: data.name,
        email: normalizeEmail(data.email),
        phone: digitsOnly(data.phone),
        password: commonUser ? data.password : undefined,
        role: data.role || undefined,
      });

      // Verificar se o email de verificação foi enviado
      if (response.data?.emailVerification?.verificationEmailSent) {
        setEmailVerificationSent(true);
      }

      setSuccess(true);
    } catch (error) {
      const errorMessage = mapApiError(error);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = (): void => {
    navigate('/login');
  };

  const renderSuccessScreen = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: { xs: 1, md: 2 }, gap: { xs: 2, md: 2.5 } }}>
      {/* Mensagem principal de sucesso */}
      <Alert
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
          {MESSAGES.SUCCESS.TITLE}
        </Box>
        <Box sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, fontWeight: 500, mt: 0.5 }}>
          {MESSAGES.SUCCESS.SUBTITLE}
        </Box>
        <Box sx={{ fontSize: { xs: '0.85rem', md: '1rem' }, fontWeight: 500, mt: 0.5 }}>
          {MESSAGES.SUCCESS.NOTIFICATION}
        </Box>
      </Alert>

      {/* Seção de verificação de email */}
      {emailVerificationSent && (
        <Box
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
            📧 Um email de verificação foi enviado para o seu endereço.
          </Typography>

          <Button
            variant="contained"
            color="info"
            fullWidth
            onClick={() => navigate('/verificar-email')}
            sx={{
              py: { xs: 1, md: 1.2 },
              fontWeight: 'bold',
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              textTransform: 'none',
            }}
          >
            Ver instruções de verificação
          </Button>
        </Box>
      )}

      {/* Botão voltar para login */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleBackToLogin}
        sx={{
          mt: { xs: 0.5, md: 1 },
          py: { xs: 1.2, md: 1.5 },
          fontWeight: 'bold',
          fontSize: { xs: '0.9rem', md: '1rem' },
        }}
      >
        Voltar para Login
      </Button>
    </Box>
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Nome"
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
            slotProps={{
              input: {
                readOnly: !commonUser,
              },
            }}
          />
        )}
      />

      {commonUser && (
        <Controller
          name="confirmEmail"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Confirmar Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.confirmEmail}
              helperText={errors.confirmEmail?.message}
            />
          )}
        />
      )}

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Telefone"
            fullWidth
            margin="normal"
            error={!!errors.phone}
            helperText={errors.phone?.message}
            inputMode="numeric"
            value={maskPhoneBR(field.value || "")}
            onChange={(e) => field.onChange(maskPhoneBR(e.target.value))}
            placeholder="(DD) 9XXXX-XXXX"
          />
        )}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label="Você é"
            fullWidth
            margin="normal"
            error={!!errors.role}
            helperText={errors.role?.message || 'Informe se você é Membro ou Líder'}
          >
            <MenuItem value="">
              <em>Selecione</em>
            </MenuItem>
            <MenuItem value="member">Membro</MenuItem>
            <MenuItem value="leader">Líder</MenuItem>
          </TextField>
        )}
      />

      {commonUser && (
        <Fragment>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Senha"
                type="password"
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Confirmar Senha"
                type="password"
                fullWidth
                margin="normal"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
            )}
          />
        </Fragment>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading || !isValid}
        sx={{
          mt: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 1 },
          fontSize: { xs: '0.95rem', md: '1rem' },
          fontWeight: 'bold',
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : commonUser ? (
          'Cadastrar'
        ) : (
          'Completar Cadastro'
        )}
      </Button>

      <Button
        variant="outlined"
        fullWidth
        onClick={handleBackToLogin}
        sx={{
          mt: { xs: 2, md: 2.5 },
          py: { xs: 1.4, md: 1 },
          fontSize: { xs: '0.9rem', md: '1rem' },
          fontWeight: 'bold',
        }}
      >
        Já tem conta?
      </Button>
    </form>
  );


  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box component="main" sx={{ flex: '1 0 auto' }}>
        <Container
          maxWidth="sm"
          sx={{
            pt: { xs: 15, md: 15 },
            pb: { xs: 5, md: 0 },
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2.25, md: 4 },
              borderRadius: 2,
              backgroundColor: '#fff',
            }}
          >
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h1"
              gutterBottom
              align="center"
              sx={{ fontWeight: 700 }}
            >
              {commonUser ? 'Cadastro de Usuário' : 'Completar Cadastro'}
            </Typography>

            {globalError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {globalError}
              </Alert>
            )}

            {success ? renderSuccessScreen() : renderForm()}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;
