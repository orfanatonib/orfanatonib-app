import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextFieldProps } from '@mui/material/TextField';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export const isoToDayjs = (isoDate: string | null | undefined): Dayjs | null => {
  if (!isoDate) return null;
  return dayjs(isoDate);
};

export const dayjsToISO = (date: Dayjs | null): string => {
  if (!date || !date.isValid()) return '';
  return date.format('YYYY-MM-DD');
};

export interface BRDatePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  error?: boolean;
  helperText?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const BRDatePicker: React.FC<BRDatePickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  minDate,
  maxDate,
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'medium',
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        format="DD/MM/YYYY"
        slotProps={{
          textField: {
            fullWidth,
            size,
            error,
            helperText,
            required,
          } as Partial<TextFieldProps>,
        }}
      />
    </LocalizationProvider>
  );
};

export default BRDatePicker;
