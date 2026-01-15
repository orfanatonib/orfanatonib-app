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
}

export default function IntegrationViewDialog({
  open,
  onClose,
  integration,
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
          {integration.image ? (
            <Avatar
              src={integration.image.url}
              alt={integration.image.title}
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
              Integração GA • {integration.integrationYear || "Ano não informado"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={3}>
          {/* Informações Pessoais */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações Pessoais
            </Typography>
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nome
                  </Typography>
                  <Typography variant="body1">
                    {integration.name || "Não informado"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body1">
                    {integration.phone || "Não informado"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Líder de GA
                  </Typography>
                  <Typography variant="body1">
                    {integration.gaLeader || "Não informado"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ano da Integração
                  </Typography>
                  <Typography variant="body1">
                    {integration.integrationYear || "Não informado"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Informações Religiosas */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações Religiosas
            </Typography>
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Batizado
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={integration.baptized ? "Sim" : "Não"}
                      color={integration.baptized ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Anos de Igreja
                  </Typography>
                  <Typography variant="body1">
                    {integration.churchYears !== undefined ? `${integration.churchYears} anos` : "Não informado"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Ministério Anterior
                  </Typography>
                  <Typography variant="body1">
                    {integration.previousMinistry || "Não informado"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Imagem */}
          {integration.image && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Imagem
              </Typography>
              <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <img
                    src={integration.image.url}
                    alt={integration.image.title}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e0e0e0",
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {integration.image.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {integration.image.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tipo: {integration.image.mediaType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tamanho: {integration.image.size ? `${(integration.image.size / 1024).toFixed(1)} KB` : "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Metadados */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações do Sistema
            </Typography>
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Criado em
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(integration.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Atualizado em
                  </Typography>
                  <Typography variant="body1">
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
