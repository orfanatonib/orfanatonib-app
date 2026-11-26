import React from 'react';
import { gradients } from '@/theme';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ContactFormData, ContactFormProps } from '../types';
import { contactFormSchema } from '../validation';
import { maskPhoneBR } from '@/utils/masks';

const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  loading,
  submitted,
  globalError,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      telefone: '',
      mensagem: '',
      website: '',
    },
  });

  const handleFormSubmit = async (data: ContactFormData) => {
    // Falhou: o que a pessoa digitou fica na tela para tentar de novo.
    if (await onSubmit(data)) reset();
  };

  return (
    <Box>
      {globalError && (
        <Alert data-testid="contact-error" severity="error" sx={{ mb: 2 }}>
          {globalError}
        </Alert>
      )}
      {submitted && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Mensagem enviada com sucesso!
        </Alert>
      )}

      <Box component="form" data-testid="contact-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Isca anti-robô: fora da tela e do teclado; se vier preenchida, a API descarta a mensagem. */}
        <Controller
          name="website"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              data-testid="contact-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
            />
          )}
        />
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          )}
        />

        <Controller
          name="telefone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Telefone"
              fullWidth
              margin="normal"
              error={!!errors.telefone}
              helperText={errors.telefone?.message}
              inputMode="numeric"
              value={maskPhoneBR(field.value || "")}
              onChange={(e) => field.onChange(maskPhoneBR(e.target.value))}
              placeholder="(DD) 9XXXX-XXXX"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          )}
        />

        <Controller
          name="mensagem"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Mensagem"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              error={!!errors.mensagem}
              helperText={errors.mensagem?.message}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth={isMobile}
          sx={{
            mt: 3,
            py: 1.5,
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: '#009933',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#FFFF00',
              color: '#000000',
            },
          }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Enviando...' : 'Enviar Mensagem'}
        </Button>
      </Box>
    </Box>
  );
};

export default ContactForm;
