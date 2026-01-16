import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
} from "@mui/material";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { IntegrationResponseDto } from "../types";

interface IntegrationViewDialogProps {
  open: boolean;
  onClose: () => void;
  integration: IntegrationResponseDto | null;
  onImageClick?: (integration: IntegrationResponseDto, startIndex: number) => void;
}

export default function IntegrationViewDialog({
  open,
  onClose,
  integration,
  onImageClick,
}: IntegrationViewDialogProps) {
  if (!integration) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {integration.images && integration.images.length > 0 ? (
            <Avatar
              src={integration.images[0].url}
              alt={integration.images[0].title}
              sx={{ width: 60, height: 60 }}
            />
          ) : (
            <Avatar sx={{ width: 60, height: 60, bgcolor: "primary.main" }}>
              {integration.name?.charAt(0)?.toUpperCase() || "?"}
            </Avatar>
          )}
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {integration.name || "Nome não informado"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Integração Feira de Ministérios • {integration.integrationYear || "Ano não informado"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={3}>
          {integration.images && integration.images.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📸 Fotos da Integração
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
                {integration.images.map((image, index) => (
                  <Box
                    key={image.id}
                    sx={{
                      position: "relative",
                      cursor: onImageClick ? "pointer" : "default",
                      transition: "transform 0.2s",
                      "&:hover": onImageClick ? {
                        transform: "scale(1.05)",
                        boxShadow: 2,
                      } : {},
                    }}
                    onClick={() => onImageClick?.(integration, index)}
                  >
                    <img
                      src={image.url}
                      alt={image.title || `Foto ${index + 1}`}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "2px solid #e0e0e0",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        bgcolor: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </Box>
                    {onImageClick && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: "rgba(0, 0, 0, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0,
                          transition: "opacity 0.2s",
                          "&:hover": {
                            opacity: 1,
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "white",
                            bgcolor: "rgba(0, 0, 0, 0.6)",
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: "0.6rem",
                          }}
                        >
                          Ampliar
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações do Sistema
            </Typography>
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ano da Integração
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {integration.integrationYear || "Não informado"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data de Cadastro
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(integration.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Última Atualização
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(integration.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
