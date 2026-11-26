import { useEffect, useState } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ptBR } from "@mui/x-date-pickers/locales";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";

const VALUE_FORMAT = "YYYY-MM-DD";
const DISPLAY_FORMAT = "DD/MM/YYYY";
const PT_BR_TEXT = ptBR.components.MuiLocalizationProvider.defaultProps.localeText;

export interface DayPickerFieldProps {
  label: string;
  /** `YYYY-MM-DD`, ou `''` quando não há dia completo. */
  value: string;
  onChange: (value: string) => void;
  /** `data-testid` do `<input>` (o que o teste preenche). */
  testId?: string;
  minDate?: string;
  maxDate?: string;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
}

const parse = (value: string): Dayjs | null => {
  const parsed = value ? dayjs(value, VALUE_FORMAT) : null;
  return parsed?.isValid() ? parsed : null;
};

/**
 * Seletor de dia em português (calendário, `dd/mm/aaaa`, botão de limpar).
 *
 * Guarda o que está sendo digitado; para fora só sai um dia completo (`YYYY-MM-DD`) ou `''`.
 * Devolver valor parcial ao próprio campo apagaria a digitação a cada tecla.
 */
export default function DayPickerField({
  label,
  value,
  onChange,
  testId,
  minDate,
  maxDate,
  error,
  helperText,
  size = "medium",
}: DayPickerFieldProps) {
  const [draft, setDraft] = useState<Dayjs | null>(() => parse(value));

  // Valor trocado por fora (atalho, limpar filtros) substitui o rascunho.
  useEffect(() => {
    setDraft((current) => {
      const currentValue = current?.isValid() ? current.format(VALUE_FORMAT) : "";
      return currentValue === value ? current : parse(value);
    });
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br" localeText={PT_BR_TEXT}>
      <DatePicker
        label={label}
        value={draft}
        onChange={(next: Dayjs | null) => {
          setDraft(next);
          onChange(next?.isValid() ? next.format(VALUE_FORMAT) : "");
        }}
        minDate={parse(minDate ?? "") ?? undefined}
        maxDate={parse(maxDate ?? "") ?? undefined}
        format={DISPLAY_FORMAT}
        enableAccessibleFieldDOMStructure={false}
        slotProps={{
          field: { clearable: true },
          // Alvo de toque de 44 px para o ícone do calendário no celular.
          openPickerButton: { sx: { minWidth: 44, minHeight: 44 } },
          textField: {
            fullWidth: true,
            size,
            error,
            helperText,
            inputProps: testId ? { "data-testid": testId } : undefined,
          },
        }}
      />
    </LocalizationProvider>
  );
}
