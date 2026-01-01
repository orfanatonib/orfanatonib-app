import React from "react";
import { Box, Paper, Avatar, Typography, useTheme } from "@mui/material";
import { MenuBook as LessonIcon } from "@mui/icons-material";

export default function LeaderInfoBanner() {
  const theme = useTheme();

  return (
    <Paper
      elevation={4}
      sx={{
        mb: 4,
        p: { xs: 2.5, sm: 3, md: 4 },
        borderRadius: 4,
        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 50%, ${(theme.palette as any).orange?.main || "#ff6d00"} 100%)`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: { xs: "150px", sm: "200px", md: "300px" },
          height: "100%",
          background:
            "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"80\" cy=\"20\" r=\"40\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"90\" cy=\"70\" r=\"30\" fill=\"rgba(255,255,255,0.08)\"/></svg>')",
          backgroundSize: "cover",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          gap: { xs: 2, sm: 2.5, md: 3 },
          flexDirection: { xs: "column", md: "row" },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "rgba(255,255,255,0.25)",
            color: "white",
            width: { xs: 56, sm: 64, md: 72 },
            height: { xs: 56, sm: 64, md: 72 },
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            "& svg": {
              fontSize: { xs: 28, sm: 32, md: 36 },
            },
          }}
        >
          <LessonIcon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            color="white"
            sx={{
              fontSize: { xs: "1.25rem", sm: "1.4rem", md: "1.5rem" },
              mb: 1,
              textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            👋 Olá, Líder!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255,255,255,0.95)",
              lineHeight: 1.7,
              fontSize: { xs: "0.9rem", sm: "0.95rem", md: "1rem" },
            }}
          >
            Esta página é para você <strong>planejar suas visitas com antecedência</strong>!
            Informe qual lição pretende adotar em cada visita ao abrigo.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.8)",
              mt: 1,
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              fontStyle: "italic",
            }}
          >
            💡 Dica: Data, horário e sala de reunião podem ser preenchidos depois!
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
