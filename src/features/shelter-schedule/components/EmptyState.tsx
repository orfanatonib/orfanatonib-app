import React from "react";
import { Box, Paper, Typography, Button, alpha, useTheme } from "@mui/material";
import { Add as AddIcon, CalendarMonth as CalendarIcon } from "@mui/icons-material";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 6,
        textAlign: "center",
        borderRadius: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }}
    >
      <CalendarIcon sx={{ fontSize: 80, color: "grey.300", mb: 2 }} />
      <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="medium">
        Nenhum agendamento encontrado
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Comece criando o primeiro agendamento para sua equipe
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
        sx={{ borderRadius: 3, px: 4 }}
      >
        Criar Primeiro Agendamento
      </Button>
    </Paper>
  );
}
