import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Check, ContentCopy, ErrorOutline } from "@mui/icons-material";

import { logger } from "@/utils/logger";

type CopyState = "idle" | "copied" | "failed";

const FEEDBACK_MS = 1800;

/** Copia `value` para a área de transferência e mostra o resultado (copiado / não foi possível). */
export function CopyButton({ value, title = "Copiar" }: { value?: string; title?: string }) {
  const [state, setState] = useState<CopyState>("idle");

  const flash = (next: CopyState) => {
    setState(next);
    setTimeout(() => setState("idle"), FEEDBACK_MS);
  };

  const copyToClipboard = async (text?: string) => {
    if (!text) return;
    try {
      if (!navigator.clipboard) throw new Error("clipboard indisponível");
      await navigator.clipboard.writeText(String(text));
      flash("copied");
    } catch (error: unknown) {
      logger.warn("Não foi possível copiar para a área de transferência", undefined, error);
      flash("failed");
    }
  };

  const label = state === "copied" ? "Copiado!" : state === "failed" ? "Não foi possível copiar" : title;

  return (
    <Tooltip title={label}>
      <IconButton
        data-testid="copy-button"
        size="small"
        aria-label={label}
        onClick={() => void copyToClipboard(value)}
        sx={{ p: 0.5, minWidth: 44, minHeight: 44 }}
      >
        {state === "copied" ? (
          <Check fontSize="small" color="success" />
        ) : state === "failed" ? (
          <ErrorOutline fontSize="small" color="error" />
        ) : (
          <ContentCopy fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
