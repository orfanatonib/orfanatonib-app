import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

export function CopyButton({ value, title = "Copiar" }: { value?: string; title?: string }) {
  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text)).catch(() => {});
  };
  return (
    <Tooltip title={title}>
      <IconButton 
        size="small" 
        onClick={() => copyToClipboard(value)}
        sx={{ p: 0.5 }}
      >
        <ContentCopy fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
