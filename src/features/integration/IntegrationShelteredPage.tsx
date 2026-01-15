import React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Snackbar,
  Avatar,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import MuiAlert from "@mui/material/Alert";
import { useForm, Controller } from "react-hook-form";
import BackHeader from "@/components/common/header/BackHeader";
import { apiCreateIntegration } from "./api";
import type { CreateIntegrationDto } from "./types";
import { maskPhoneBR } from "@/utils/masks";
import IntegrationImageUpload from "./components/IntegrationImageUpload";

type FormData = {
  name?: string;
};

export default function IntegrationShelteredPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shelteredId = searchParams.get('shelteredId');
  const shelteredName = searchParams.get('shelteredName') || '';

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: shelteredName,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");

    try {
      const imagesData = selectedFiles.length > 0 ? selectedFiles.map((file, index) => ({
        title: shelteredName ? `Foto ${index + 1} - ${shelteredName}` : `Foto ${index + 1}`,
        description: shelteredName
          ? `Foto da integração de ${shelteredName} na Feira de Ministério`
          : "Foto tirada durante o registro da integração GA",
        fieldKey: index === 0 ? 'profile' : `additional-${index}`,
      })) : undefined;

      const integrationData: CreateIntegrationDto = {
        name: data.name,
        integrationYear: new Date().getFullYear(),
        ...(imagesData && { images: imagesData }),
      };

      await apiCreateIntegration(integrationData, selectedFiles.length > 0 ? selectedFiles[0] : undefined);
      setSuccess(true);

      // Limpar formulário após sucesso
      reset();
      setSelectedFiles([]);

      // Redirecionar após alguns segundos
      setTimeout(() => {
        navigate('/area-dos-acolhidos');
      }, 3000);

    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Erro ao registrar integração"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pb: 4,
      }}
    >
      <BackHeader title="Registrar Integração GA" />

      <Container maxWidth="md" sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "#ffffff",
          }}
        >
          {/* Cabeçalho */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.main",
                mx: "auto",
                mb: 2,
                fontSize: "2rem",
              }}
            >
              {shelteredName.charAt(0)?.toUpperCase() || "I"}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Registrar Integração GA
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Registre a integração de {shelteredName || "uma pessoa"} na Feira de Ministério
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Informações Pessoais */}
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nome Completo"
                      placeholder="Nome da pessoa"
                      required
                    />
                  )}
                />
              </Grid>

            {/* Foto da Integração */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                Foto da Integração
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tire uma foto da pessoa sendo integrada na Feira de Ministério
              </Typography>
              <Box sx={{ mt: 2 }}>
                <IntegrationImageUpload
                  onImagesSelect={(files) => setSelectedFiles(prev => [...prev, ...files])}
                  onError={(error) => setError(error)}
                  personName={shelteredName}
                />
              </Box>
            </Grid>

              {/* Botões */}
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => navigate('/area-dos-acolhidos')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      minWidth: 150,
                      fontWeight: "bold",
                    }}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                  >
                    {loading ? "Registrando..." : "Registrar Integração"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Snackbar de sucesso */}
        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={handleCloseSuccess}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={handleCloseSuccess}
            severity="success"
          >
            Integração registrada com sucesso! Redirecionando...
          </MuiAlert>
        </Snackbar>
      </Container>
    </Box>
  );
}
