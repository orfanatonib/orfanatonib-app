import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import { Profile, UpdateProfileDto } from '../types';
import { apiUpdateProfile } from '../api';

interface ProfileEditFormProps {
  profile: Profile | null;
  onUpdate: () => void;
  onError: (error: string) => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  onUpdate,
  onError,
}) => {
  const [formData, setFormData] = useState<UpdateProfileDto>({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateProfileDto, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateProfileDto, string>> = {};

    if (formData.name && formData.name.trim().length < 2) {
      newErrors.name = 'O nome deve ter pelo menos 2 caracteres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    onError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Remove campos vazios antes de enviar
      const payload: UpdateProfileDto = {};
      if (formData.name && formData.name.trim() !== profile?.name) {
        payload.name = formData.name.trim();
      }
      if (formData.email && formData.email.trim() !== profile?.email) {
        payload.email = formData.email.trim();
      }
      if (formData.phone && formData.phone.trim() !== profile?.phone) {
        payload.phone = formData.phone.trim();
      }

      if (Object.keys(payload).length === 0) {
        onError('Nenhuma alteração foi feita');
        setIsSubmitting(false);
        return;
      }

      await apiUpdateProfile(payload);
      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Erro ao atualizar perfil';
      onError(errorMessage);
      
      // Tratamento específico para email duplicado
      if (errorMessage.includes('já está em uso')) {
        setErrors({ email: 'Este email já está em uso por outro usuário' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                error={!!errors.name}
                helperText={errors.name}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                error={!!errors.email}
                helperText={errors.email}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="tel"
                label="Telefone"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="+5511999999999"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>

            {success && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Perfil atualizado com sucesso!
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={isSubmitting}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                    },
                  }}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </motion.div>
  );
};

export default ProfileEditForm;

