import React from "react";
import { Paper, Typography, Box } from "@mui/material";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 4,
        textAlign: "center",
        borderRadius: 3,
        bgcolor: "background.paper",
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "center", color: "text.secondary" }}>
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 48, color: "text.secondary" } })
            : icon
          }
        </Box>
      )}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Paper>
  );
}