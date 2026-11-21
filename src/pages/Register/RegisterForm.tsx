import React from 'react';
import { Controller, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { Button, CircularProgress, MenuItem, TextField } from '@mui/material';

import { REGISTER_VALIDATION_MESSAGES } from '@/constants/errors';
import {
  REGISTER_ROLE_OPTIONS,
  REGISTER_SUBMIT_LABELS,
  REGISTER_TEAM_HELPER_TEXT,
} from '@/features/auth/register.constants';
import type { RegisterFormData } from '@/features/auth/register.types';
import type { ShelterTeamOption } from '@/features/auth/types';
import { maskPhoneBR } from '@/utils/masks';
import { normalizeName } from '@/utils/textUtils';

interface RegisterFormProps {
  commonUser: boolean;
  control: Control<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  setValue: UseFormSetValue<RegisterFormData>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onBackToLogin: () => void;
  loading: boolean;
  isValid: boolean;
  isMemberSelected: boolean;
  teams: ShelterTeamOption[];
  loadingTeams: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  commonUser,
  control,
  errors,
  setValue,
  onSubmit,
  onBackToLogin,
  loading,
  isValid,
  isMemberSelected,
  teams,
  loadingTeams,
}) => (
  <form data-testid="register-form" onSubmit={onSubmit} noValidate>
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
          onBlur={() => {
            field.onBlur();
            setValue('name', normalizeName(field.value || ''));
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
          inputProps={{ 'data-testid': 'register-email' }}
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          slotProps={{ input: { readOnly: !commonUser } }}
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
          value={maskPhoneBR(field.value || '')}
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
          {REGISTER_ROLE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value} data-testid={`register-role-${option.value}`}>
              {option.label}
            </MenuItem>
          ))}
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
            inputProps={{ 'data-testid': 'register-team' }}
            fullWidth
            margin="normal"
            disabled={loadingTeams}
            helperText={REGISTER_TEAM_HELPER_TEXT}
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
      <>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Senha"
              type="password"
              inputProps={{ 'data-testid': 'register-password' }}
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
              inputProps={{ 'data-testid': 'register-confirm-password' }}
              fullWidth
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
          )}
        />
      </>
    )}

    <Button
      data-testid="register-submit"
      type="submit"
      variant="contained"
      fullWidth
      disabled={loading || !isValid}
      sx={{ mt: { xs: 2, md: 3 }, py: { xs: 1.5, md: 1 }, fontSize: { xs: '0.95rem', md: '1rem' }, fontWeight: 'bold' }}
    >
      {loading ? (
        <CircularProgress size={24} color="inherit" />
      ) : commonUser ? (
        REGISTER_SUBMIT_LABELS.common
      ) : (
        REGISTER_SUBMIT_LABELS.complete
      )}
    </Button>

    <Button
      data-testid="register-login-link"
      variant="outlined"
      fullWidth
      onClick={onBackToLogin}
      sx={{ mt: { xs: 2, md: 2.5 }, py: { xs: 1.4, md: 1 }, fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 'bold' }}
    >
      Já tem conta?
    </Button>
  </form>
);

export default RegisterForm;
