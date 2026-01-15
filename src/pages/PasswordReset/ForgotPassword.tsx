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
import api from '@/config/axiosConfig';

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
            const response = await api.post('/auth/forgot-password', { email });

            if (response.data.status === 'VERIFICATION_EMAIL_SENT') {
                setErrorMessage(null);
                setSuccessMessage('Seu email ainda não foi verificado na AWS. Enviamos um email de verificação. Após confirmar seu email, solicite a recuperação de senha novamente.');
            } else {
                setSuccessMessage(response.data.message || 'Instruções enviadas para o seu email.');
            }
            setCooldown(120);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erro ao processar solicitação.';
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
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
                    <Typography variant="h5" component="h1" gutterBottom align="center">
                        Recuperar Senha
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Informe seu email para receber as instruções de recuperação.
                    </Typography>

                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }}>
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
                    {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading || cooldown > 0}
                        />
                        <Button
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
