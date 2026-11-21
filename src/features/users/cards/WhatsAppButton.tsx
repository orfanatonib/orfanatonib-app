import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { WhatsApp } from "@mui/icons-material";

const WhatsAppButton: React.FC<{ href: string | null; testId?: string; sx?: object }> = ({ href, testId, sx }) => (
  <Tooltip title={href ? "WhatsApp" : "Sem telefone"}>
    <span>
      <IconButton
        size="small"
        color="success"
        component="a"
        href={href || undefined}
        target="_blank"
        rel="noopener noreferrer"
        disabled={!href}
        aria-label="abrir WhatsApp"
        data-testid={testId}
        sx={sx}
      >
        <WhatsApp fontSize="large" />
      </IconButton>
    </span>
  </Tooltip>
);

export default WhatsAppButton;
