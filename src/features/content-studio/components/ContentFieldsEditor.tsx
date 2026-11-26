import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CONTENT_ARRAY_TEMPLATES,
  CONTENT_FIELD_LABELS,
} from "../editor.constants";
import type { ContentFieldProps } from "../workspace.types";
import { isRecord } from "../workspace.utils";

export function ContentFieldsEditor({
  fieldKey,
  value,
  disabled,
  onChange,
}: ContentFieldProps) {
  const label = CONTENT_FIELD_LABELS[fieldKey] ?? fieldKey;
  if (Array.isArray(value)) {
    return (
      <Stack spacing={2} data-testid={`content-studio-field-${fieldKey}`}>
        <Typography component="h3" variant="subtitle1" fontWeight={700}>
          {label}
        </Typography>
        {value.map((item: unknown, index: number) => (
          <Box
            key={index}
            sx={{ borderLeft: "2px solid", borderColor: "divider", pl: 2 }}
          >
            <ContentFieldsEditor
              fieldKey={fieldKey}
              value={item}
              disabled={disabled}
              onChange={(next) =>
                onChange(
                  value.map((entry: unknown, at: number) =>
                    at === index ? next : entry,
                  ),
                )
              }
            />
            {!disabled && (
              <Button
                sx={{ minHeight: 44 }}
                color="inherit"
                onClick={() =>
                  onChange(
                    value.filter((_: unknown, at: number) => at !== index),
                  )
                }
              >
                Remover item {index + 1}
              </Button>
            )}
          </Box>
        ))}
        {!disabled && (
          <Button
            variant="outlined"
            sx={{ minHeight: 44, alignSelf: "flex-start" }}
            onClick={() =>
              onChange([
                ...value,
                structuredClone(CONTENT_ARRAY_TEMPLATES[fieldKey] ?? ""),
              ])
            }
          >
            Adicionar em {label.toLowerCase()}
          </Button>
        )}
      </Stack>
    );
  }
  if (isRecord(value)) {
    return (
      <Stack spacing={2} data-testid={`content-studio-field-${fieldKey}`}>
        {fieldKey && (
          <Typography component="h3" variant="subtitle1" fontWeight={700}>
            {label}
          </Typography>
        )}
        {Object.entries(value).map(([key, entry]) => (
          <ContentFieldsEditor
            key={key}
            fieldKey={key}
            value={entry}
            disabled={disabled}
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        ))}
      </Stack>
    );
  }
  if (typeof value === "boolean") {
    return (
      <FormControlLabel
        data-testid={`content-studio-field-${fieldKey}`}
        label={label}
        control={
          <Checkbox
            checked={value}
            disabled={disabled}
            onChange={(_, checked) => onChange(checked)}
          />
        }
      />
    );
  }
  return (
    <TextField
      data-testid={`content-studio-field-${fieldKey}`}
      fullWidth
      label={label}
      value={value === null ? "" : String(value)}
      disabled={disabled}
      type={typeof value === "number" ? "number" : "text"}
      multiline={typeof value !== "number"}
      minRows={typeof value !== "number" ? 2 : undefined}
      onChange={(event) =>
        onChange(
          typeof value === "number"
            ? Number(event.target.value)
            : event.target.value,
        )
      }
    />
  );
}
