import React from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Carregando página de ideias..." }: LoadingStateProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Box textAlign="center">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" mt={2} color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  );
}

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Alert
        severity="error"
        sx={{
          maxWidth: 500,
          width: "100%",
          fontSize: "1.1rem",
          borderRadius: 3,
        }}
      >
        {message}
      </Alert>
    </Box>
  );
}

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "Nenhuma página de ideias encontrada." }: EmptyStateProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Typography
        variant="h5"
        align="center"
        color="text.secondary"
        sx={{ maxWidth: 400 }}
      >
        {message}
      </Typography>
    </Box>
  );
}
