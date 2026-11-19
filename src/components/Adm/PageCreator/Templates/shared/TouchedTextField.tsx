import { TextField } from '@mui/material';
import { REQUIRED_FIELD_MESSAGE } from './constants';
import { PAGE_FIELD_SX } from './styles';
import type { TouchedTextFieldProps } from './types';

/** Campo obrigatório que só mostra o erro depois de tocado (padrão dos criadores). */
export default function TouchedTextField({
  testId,
  label,
  value,
  type = 'text',
  touched,
  onChange,
  onTouchedChange,
  trimValue = true,
}: TouchedTextFieldProps) {
  const isEmpty = trimValue ? !value.trim() : !value;
  const showError = touched && isEmpty;

  return (
    <TextField
      fullWidth
      type={type}
      label={label}
      required
      value={value}
      inputProps={{ 'data-testid': testId }}
      {...(type === 'date' ? { InputLabelProps: { shrink: true } } : {})}
      onChange={(e) => {
        onChange(e.target.value);
        if (touched) onTouchedChange(false);
      }}
      onBlur={() => onTouchedChange(true)}
      error={showError}
      helperText={showError ? REQUIRED_FIELD_MESSAGE : ''}
      sx={PAGE_FIELD_SX}
    />
  );
}
