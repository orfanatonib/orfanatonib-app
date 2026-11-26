import { Box, Stack, Typography } from "@mui/material";
import { CONTENT_FIELD_LABELS } from "../editor.constants";
import type { ContentFieldProps } from "../workspace.types";
import { isRecord } from "../workspace.utils";

export function ContentDocumentPreview({
  fieldKey,
  value,
}: Pick<ContentFieldProps, "fieldKey" | "value">) {
  if (value === null || value === "" || (Array.isArray(value) && !value.length))
    return null;
  const title = CONTENT_FIELD_LABELS[fieldKey] ?? fieldKey;
  return (
    <Box
      data-testid={`content-studio-preview-${fieldKey}`}
      sx={{ overflowWrap: "anywhere" }}
    >
      {fieldKey && (
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      {Array.isArray(value) ? (
        <Stack spacing={2}>
          {value.map((item: unknown, index: number) => (
            <ContentDocumentPreview key={index} fieldKey="" value={item} />
          ))}
        </Stack>
      ) : isRecord(value) ? (
        <Stack spacing={3}>
          {Object.entries(value).map(([key, entry]) => (
            <ContentDocumentPreview key={key} fieldKey={key} value={entry} />
          ))}
        </Stack>
      ) : (
        <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {String(value)}
        </Typography>
      )}
    </Box>
  );
}
