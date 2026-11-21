import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiForgotPassword } from '@/features/auth/api';
import {
    AUTH_ERROR_MESSAGES,
    AUTH_SUCCESS_MESSAGES,
    AUTH_VALIDATION
} from '@/constants/errors';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();

    React.useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const data = await apiForgotPassword(email);

            setSuccessMessage(data.message || AUTH_SUCCESS_MESSAGES.RESET_INSTRUCTIONS_SENT);
            setCooldown(AUTH_VALIDATION.COOLDOWN_SECONDS);
        } catch (error: unknown) {
            const msg = getApiErrorMessage(error, AUTH_ERROR_MESSAGES.FORGOT_PASSWORD_GENERIC);
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                pt: { xs: 10, md: 15 },
                px: 2,
            }}
        >
            <Container maxWidth="sm">
                <Paper data-testid="forgot-password-page" elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
                    <Typography variant="h5" component="h1" gutterBottom align="center">
                        Recuperar Senha
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Informe seu email para receber as instruções de recuperação.
                    </Typography>

                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }} data-testid="forgot-password-success">
                            {successMessage}
                            {successMessage.includes('verificado na AWS') && (
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => navigate('/verificar-email')}
                                    sx={{ display: 'block', mt: 1, textDecoration: 'underline' }}
                                >
                                    Ver como verificar
                                </Button>
                            )}
                        </Alert>
                    )}
                    {errorMessage && <Alert severity="error" sx={{ mb: 2 }} data-testid="forgot-password-error">{errorMessage}</Alert>}

                    <Box component="form" data-testid="forgot-password-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            inputProps={{ 'data-testid': 'forgot-password-email' }}
                            label="Email"
                            type="email"
                            fullWidth
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading || cooldown > 0}
                        />
                        <Button
                            data-testid="forgot-password-submit"
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading || cooldown > 0}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : cooldown > 0 ? (
                                `Reenviar em ${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')}`
                            ) : (
                                'Recuperar Senha'
                            )}
                        </Button>
                        <Button
                            data-testid="forgot-password-back"
                            variant="text"
                            onClick={() => navigate('/login')}
                            fullWidth
                        >
                            Voltar para Login
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ForgotPassword;
