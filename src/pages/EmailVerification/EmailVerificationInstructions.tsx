import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { useNavigate } from 'react-router-dom';
import { apiResendVerification } from '@/features/auth/api';

/**
 * Instruções de confirmação de e-mail.
 *
 * A API envia o próprio link de confirmação por SMTP (Gmail); a tela explica o
 * fluxo e permite reenviar o e-mail.
 */
const EmailVerificationInstructions: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setSending(true);
    setFeedback(null);
    setError(null);

    try {
      const data = await apiResendVerification(email.trim());
      setFeedback(
        data.message ??
          'Se houver uma conta com este e-mail pendente de confirmação, enviamos um novo link.',
      );
    } catch {
      setError('Não foi possível reenviar agora. Tente novamente em alguns minutos.');
    } finally {
      setSending(false);
    }
  };

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
        <Paper data-testid="verify-email-instructions" elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MarkEmailReadOutlinedIcon sx={{ fontSize: 56, color: 'primary.main' }} />
            <Typography variant="h5" component="h1" sx={{ mt: 1 }}>
              Confirme seu e-mail
            </Typography>
          </Box>

          <Typography sx={{ mb: 2 }}>
            Enviamos um link de confirmação para o e-mail do seu cadastro. Para concluir:
          </Typography>

          <Box component="ol" sx={{ pl: 3, mb: 3, '& li': { mb: 1 } }}>
            <li>Abra sua caixa de entrada (confira também o spam e as promoções).</li>
            <li>
              Procure o e-mail <b>&quot;Confirme seu e-mail - Orfanatos NIB&quot;</b>.
            </li>
            <li>
              Clique em <b>Confirmar e-mail</b>. O link vale por 24 horas.
            </li>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Confirmar o e-mail não libera o acesso sozinho: a coordenação ainda precisa
            aprovar sua conta. Você recebe outro aviso quando isso acontecer.
          </Alert>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Não recebeu? Reenviar o link:
          </Typography>

          <Box component="form" data-testid="verify-email-form" onSubmit={handleResend} sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              inputProps={{ 'data-testid': 'verify-email-email' }}
              fullWidth
              size="small"
              type="email"
              label="Seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={sending}
            />
            <Button data-testid="verify-email-submit" type="submit" variant="contained" disabled={sending || !email.trim()}>
              {sending ? <CircularProgress size={22} /> : 'Reenviar'}
            </Button>
          </Box>

          {feedback && (
            <Alert severity="success" sx={{ mb: 2 }} data-testid="verify-email-feedback">
              {feedback}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} data-testid="verify-email-error">
              {error}
            </Alert>
          )}

          <Button data-testid="verify-email-login" fullWidth variant="text" onClick={() => navigate('/login')}>
            Voltar para o login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailVerificationInstructions;
