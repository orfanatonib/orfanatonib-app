import { TextField, TextFieldProps } from '@mui/material';
import { useState } from 'react';

interface FormTextFieldProps extends Omit<TextFieldProps, 'error' | 'helperText'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  touched?: boolean;
  errorMessage?: string;
  showErrorOnBlur?: boolean;
}

export function FormTextField({
  value,
  onChange,
  required = false,
  touched = false,
  errorMessage,
  showErrorOnBlur = true,
  label,
  ...props
}: FormTextFieldProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const showError = touched || (showErrorOnBlur && isBlurred);
  const hasError = required && showError && !value.trim();
  const displayError = hasError && showError;

  return (
    <TextField
      {...props}
      label={
        required ? (
          <span>
            {label}
            <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
          </span>
        ) : (
          label
        )
      }
      value={value}
      onChange={onChange}
      onBlur={() => setIsBlurred(true)}
      error={displayError}
      helperText={displayError ? errorMessage || 'Campo obrigatório' : props.helperText || ''}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: displayError ? '#d32f2f' : 'primary.main',
            },
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: displayError ? '#d32f2f' : 'primary.main',
            },
          },
          '&.Mui-error': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#d32f2f',
            },
          },
        },
        '& .MuiFormHelperText-root': {
          marginLeft: 0,
          marginTop: 1,
          fontSize: '0.75rem',
          transition: 'all 0.2s ease',
        },
        '& .MuiInputLabel-root': {
          '&.Mui-focused': {
            color: displayError ? '#d32f2f' : 'primary.main',
          },
        },
        ...props.sx,
      }}
    />
  );
}

