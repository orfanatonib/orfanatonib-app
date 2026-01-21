import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '@/config/axiosConfig';
import {
    AUTH_ERROR_MESSAGES,
    AUTH_SUCCESS_MESSAGES,
    AUTH_VALIDATION
} from '@/constants/errors';
import type { ValidateTokenResponse, ResetPasswordResponse } from '@/types/api/auth';

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setValidationError(AUTH_ERROR_MESSAGES.TOKEN_NOT_PROVIDED);
            setLoading(false);
            return;
        }

        const validateToken = async () => {
            try {
                const response = await api.get<ValidateTokenResponse>(`/auth/reset-password/validate?token=${token}`);
                if (response.data.valid) {
                    setIsValidToken(true);
                    setUserEmail(response.data.email || '');
                } else {
                    setValidationError(AUTH_ERROR_MESSAGES.TOKEN_INVALID);
                }
            } catch (error) {
                setValidationError(AUTH_ERROR_MESSAGES.TOKEN_INVALID);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setSubmitError(AUTH_ERROR_MESSAGES.PASSWORDS_DO_NOT_MATCH);
            return;
        }
        if (newPassword.length < AUTH_VALIDATION.MIN_PASSWORD_LENGTH) {
            setSubmitError(AUTH_ERROR_MESSAGES.PASSWORD_TOO_SHORT);
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        try {
            await api.post<ResetPasswordResponse>('/auth/reset-password', { token, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), AUTH_VALIDATION.REDIRECT_DELAY_MS);
        } catch (error: any) {
            setSubmitError(error.response?.data?.message || AUTH_ERROR_MESSAGES.RESET_PASSWORD_GENERIC);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isValidToken) {
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
                    <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h5" component="h1" gutterBottom color="error.main" fontWeight="bold">
                            Link Inválido ou Expirado
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {validationError || 'O link de recuperação que você acessou é inválido.'} <br />
                            Por favor, solicite uma nova redefinição de senha.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={() => navigate('/esqueci-minha-senha')}
                            fullWidth
                        >
                            Solicitar Novo Link
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

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
                        Redefinir Senha
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Defina uma nova senha para: <strong>{userEmail}</strong>
                    </Typography>

                    {success ? (
                        <Alert severity="success">
                            {AUTH_SUCCESS_MESSAGES.PASSWORD_CHANGED}
                        </Alert>
                    ) : (
                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {submitError && <Alert severity="error">{submitError}</Alert>}

                            <TextField
                                label="Nova Senha"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="Confirmar Nova Senha"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                error={newPassword !== confirmPassword && confirmPassword.length > 0}
                                helperText={
                                    newPassword !== confirmPassword && confirmPassword.length > 0
                                        ? 'As senhas devem ser iguais'
                                        : ''
                                }
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={submitting}
                            >
                                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Redefinir Senha'}
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default ResetPassword;
