import React from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

interface ScheduleHeaderProps {
  schedulesCount: number;
  sheltersCount: number;
  onCreateClick: () => void;
}

export default function ScheduleHeader({
  schedulesCount,
  sheltersCount,
  onCreateClick,
}: ScheduleHeaderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        mb: 4,
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Agendamentos de Visitas
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {schedulesCount} agendamento{schedulesCount !== 1 ? "s" : ""} • {sheltersCount} abrigo
          {sheltersCount !== 1 ? "s" : ""}
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
        sx={{
          borderRadius: 3,
          px: 3,
          py: 1.2,
          fontWeight: "bold",
          boxShadow: 4,
          display: { xs: "none", sm: "flex" },
        }}
      >
        Novo Agendamento
      </Button>
    </Box>
  );
}
