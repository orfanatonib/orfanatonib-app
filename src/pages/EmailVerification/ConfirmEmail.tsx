import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate, useParams } from 'react-router-dom';
import { apiVerifyEmail } from '@/features/auth/api';

type Status = 'checking' | 'confirmed' | 'failed';

/** Destino do link enviado por e-mail: confirma o token e mostra o resultado. */
const ConfirmEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('failed');
      setMessage('Link de confirmação inválido.');
      return;
    }

    let active = true;

    const confirm = async (): Promise<void> => {
      try {
        const data = await apiVerifyEmail(token);
        if (!active) return;
        setStatus('confirmed');
        setMessage(data.message);
      } catch (error) {
        if (!active) return;
        setStatus('failed');
        const apiMessage = (error as { response?: { data?: { message?: string } } })
          .response?.data?.message;
        setMessage(apiMessage ?? 'Link de confirmação inválido ou expirado.');
      }
    };

    void confirm();

    // O token só pode ser usado uma vez: um segundo disparo do efeito em
    // StrictMode gastaria o link e a tela mostraria "inválido".
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 8, md: 12 },
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper data-testid={`confirm-email-${status}`} elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, textAlign: 'center' }}>
          {status === 'checking' && (
            <>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Confirmando seu e-mail...</Typography>
            </>
          )}

          {status === 'confirmed' && (
            <>
              <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main' }} />
              <Typography variant="h5" component="h1" sx={{ mt: 1, mb: 2 }}>
                E-mail confirmado
              </Typography>
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                {message} A coordenação ainda precisa aprovar sua conta; você recebe um
                aviso por e-mail quando o acesso for liberado.
              </Alert>
              <Button data-testid="confirm-email-login" variant="contained" onClick={() => navigate('/login')}>
                Ir para o login
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
              <Typography variant="h5" component="h1" sx={{ mt: 1, mb: 2 }}>
                Não foi possível confirmar
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Button data-testid="confirm-email-resend" variant="contained" onClick={() => navigate('/verificar-email')}>
                Reenviar o link
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ConfirmEmail;
