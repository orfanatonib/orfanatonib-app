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
import { useForm, Controller, type Resolver, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { useSelector } from 'react-redux';

import { apiListShelterTeams, apiRegister } from '@/features/auth/api';
import { cacheGoogleUser, clearGoogleUserCache, getGoogleUserCache } from '@/features/auth/googleUserCache';
import { getRegisterSchema, type RegisterRoleChoice } from '@/features/auth/registerSchema';
import type { ShelterTeamOption } from '@/features/auth/types';
import { RootState } from '@/store/slices';
import { digitsOnly, maskPhoneBR } from '@/utils/masks';
import { normalizeEmail } from '@/utils/validators';
import { normalizeName } from '@/utils/textUtils';
import { logger } from '@/utils/logger';
import {
  REGISTER_ERROR_MESSAGES,
  REGISTER_SUCCESS_MESSAGES,
  REGISTER_VALIDATION_MESSAGES,
  REGISTER_VALIDATION
} from '@/constants/errors';

interface RegisterProps {
  commonUser: boolean;
}

type RoleChoice = RegisterRoleChoice;

interface FormData {
  name: string;
  email: string;
  confirmEmail?: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  role: RoleChoice;
  teamId?: string;
}

const mapApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || REGISTER_ERROR_MESSAGES.GENERIC;
  }
  return REGISTER_ERROR_MESSAGES.UNEXPECTED;
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
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: yupResolver(getRegisterSchema(commonUser)) as unknown as Resolver<FormData>,
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
      teamId: '',
    },
  });

  const watchRole = watch('role');
  const isMemberSelected = watchRole === 'member';

  const [teams, setTeams] = useState<ShelterTeamOption[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchTeams = async () => {
      try {
        if (cancelled) return;
        setLoadingTeams(true);
        const options = await apiListShelterTeams();
        if (!cancelled) {
          setTeams(options);
        }
      } catch (error: unknown) {
        logger.warn('Não foi possível carregar as equipes no cadastro', { feature: 'register' }, error);
        if (!cancelled) {
          setTeams([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingTeams(false);
          setTeamsLoaded(true);
        }
      }
    };

    if (isMemberSelected && !teamsLoaded) {
      fetchTeams();
    }

    return () => {
      cancelled = true;
    };
  }, [isMemberSelected, teamsLoaded]);

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

    try {
      const response = await apiRegister(commonUser, {
        name: normalizeName(data.name),
        email: normalizeEmail(data.email),
        phone: digitsOnly(data.phone),
        password: commonUser ? data.password : undefined,
        role: data.role || undefined,
        teamId: isMemberSelected && data.role === 'member' ? data.teamId || undefined : undefined,
      });

      if (response.emailVerification?.verificationEmailSent) {
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
            📧 {REGISTER_SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT}
          </Typography>

          <Button
            data-testid="register-verify-instructions"
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

      <Button
        data-testid="register-back-to-login"
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
    <form data-testid="register-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Nome"
            inputProps={{ 'data-testid': 'register-name' }}
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name?.message}
            onBlur={() => { field.onBlur(); setValue('name', normalizeName(field.value || '')); }}
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
            inputProps={{ 'data-testid': 'register-email' }}
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
            inputProps={{ 'data-testid': 'register-confirm-email' }}
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
            inputProps={{ 'data-testid': 'register-phone' }}
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
            inputProps={{ 'data-testid': 'register-role' }}
            fullWidth
            margin="normal"
            error={!!errors.role}
            helperText={errors.role?.message || REGISTER_VALIDATION_MESSAGES.ROLE_HELPER}
          >
            <MenuItem value="">
              <em>Selecione</em>
            </MenuItem>
            <MenuItem value="member">Membro</MenuItem>
            <MenuItem value="leader">Líder</MenuItem>
          </TextField>
        )}
      />

      {isMemberSelected && (
        <Controller
          name="teamId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Equipe (opcional)"
              fullWidth
              margin="normal"
              helperText="Você pode escolher uma equipe agora ou deixar para o time definir depois. Se não encontrar sua equipe na lista, não tem problema: a coordenação vai te vincular à equipe correta mais pra frente."
            >
              <MenuItem value="">
                <em>Nenhuma (decidir depois)</em>
              </MenuItem>
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      )}

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
        data-testid="register-submit"
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
        data-testid="register-login-link"
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
              <Alert data-testid="register-error" severity="error" sx={{ mb: 2 }}>
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
