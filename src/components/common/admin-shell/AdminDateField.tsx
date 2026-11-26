import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ptBR } from '@mui/x-date-pickers/locales';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import { ADMIN_DATE_DISPLAY_FORMAT, ADMIN_DATE_VALUE_FORMAT } from './constants';
import type { AdminDateFieldProps } from './types';

const LOCALE_TEXT = ptBR.components.MuiLocalizationProvider.defaultProps.localeText;

const parse = (value: string | undefined): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, ADMIN_DATE_VALUE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
};

/**
 * Campo de data das toolbars, com o seletor em português (DD/MM/AAAA, meses e dias em pt-BR).
 *
 * Para fora só sai um dia completo (`AAAA-MM-DD`) ou `''`; o que está sendo digitado fica num
 * rascunho local (devolver o valor parcial ao campo apagaria a digitação a cada tecla).
 * O `data-testid` vai no `<input>` (estrutura não acessível do DOM, para poder digitar nele).
 */
export default function AdminDateField({
  label,
  value,
  onChange,
  testId,
  minDate,
  maxDate,
}: AdminDateFieldProps) {
  const [draft, setDraft] = useState<Dayjs | null>(() => parse(value));

  // Valor trocado por fora (limpar filtros) substitui o rascunho.
  useEffect(() => {
    setDraft((current) => {
      const currentValue = current?.isValid() ? current.format(ADMIN_DATE_VALUE_FORMAT) : '';
      return currentValue === value ? current : parse(value);
    });
  }, [value]);

  return (
    // `display: contents`: o invólucro não cria caixa nem muda o layout da toolbar.
    <Box data-testid={`${testId}-field`} sx={{ display: 'contents' }}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br" localeText={LOCALE_TEXT}>
        <DatePicker
          label={label}
          value={draft}
          format={ADMIN_DATE_DISPLAY_FORMAT}
          minDate={parse(minDate) ?? undefined}
          maxDate={parse(maxDate) ?? undefined}
          enableAccessibleFieldDOMStructure={false}
          onChange={(next: Dayjs | null) => {
            setDraft(next);
            onChange(next?.isValid() ? next.format(ADMIN_DATE_VALUE_FORMAT) : '');
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
              inputProps: { 'data-testid': testId, 'aria-label': label },
              sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
            },
            field: { clearable: true },
            actionBar: { actions: ['clear', 'today', 'accept'] },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
}
