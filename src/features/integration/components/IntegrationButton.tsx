import React from "react";
import { Button, Tooltip, Box } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import { useNavigate } from "react-router-dom";

interface IntegrationButtonProps {
  shelteredId?: string;
  shelteredName?: string;
  size?: "small" | "medium" | "large";
  variant?: "contained" | "outlined" | "text";
  fullWidth?: boolean;
  sx?: any;
}

export default function IntegrationButton({
  shelteredId,
  shelteredName,
  size = "small",
  variant = "outlined",
  fullWidth = false,
  sx = {},
}: IntegrationButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (shelteredId) {
      // Se tem ID do abrigado, vai para página de integração com o abrigado pré-selecionado
      navigate(`/integracao?shelteredId=${shelteredId}&shelteredName=${encodeURIComponent(shelteredName || '')}`);
    } else {
      // Se não tem ID, vai para página geral de integração
      navigate('/integracao');
    }
  };

  const tooltipText = shelteredId
    ? `Registrar ${shelteredName || 'abrigado'} na integração GA`
    : "Acessar integrações GA";

  return (
    <Tooltip title={tooltipText}>
      <Button
        variant={variant}
        size={size}
        startIcon={<GroupIcon />}
        onClick={handleClick}
        fullWidth={fullWidth}
        sx={{
          borderRadius: 2,
          fontWeight: "bold",
          ...sx,
        }}
      >
        Integração GA
      </Button>
    </Tooltip>
  );
}
