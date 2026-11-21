import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { logger } from "@/utils/logger";

interface Props {
  value?: string;
  title?: string;
  testId?: string;
}

const CopyButton: React.FC<Props> = ({ value, title = "Copiar", testId }) => {
  const copy = (text?: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text)).catch((e) => logger.warn("Clipboard write failed", undefined, e));
  };
  return (
    <Tooltip title={title}>
      <IconButton size="small" onClick={() => copy(value)} aria-label={title} data-testid={testId} sx={{ minWidth: 44, minHeight: 44 }}>
        <ContentCopy fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
};

export default CopyButton;
