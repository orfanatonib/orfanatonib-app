import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { IntegrationResponseDto, CreateIntegrationDto, UpdateIntegrationDto } from "../types";
import { maskPhoneBR } from "@/utils/masks";
import IntegrationImageUpload from "./IntegrationImageUpload";

type FormData = {
  name?: string;
  phone?: string;
  gaLeader?: string;
  baptized?: boolean;
  churchYears?: number;
  previousMinistry?: string;
  integrationYear?: number;
};

interface IntegrationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIntegrationDto | UpdateIntegrationDto, file?: File) => Promise<void>;
  editing?: IntegrationResponseDto | null;
  loading?: boolean;
  error?: string;
}

export default function IntegrationFormDialog({
  open,
  onClose,
  onSubmit,
  editing,
  loading = false,
  error,
}: IntegrationFormDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const [formData, setFormData] = React.useState<FormData>({
    name: editing?.name || "",
    phone: editing?.phone || "",
    gaLeader: editing?.gaLeader || "",
    baptized: editing?.baptized || false,
    churchYears: editing?.churchYears || undefined,
    previousMinistry: editing?.previousMinistry || "",
    integrationYear: editing?.integrationYear || new Date().getFullYear(),
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: editing?.name || "",
        phone: editing?.phone || "",
        gaLeader: editing?.gaLeader || "",
        baptized: editing?.baptized || false,
        churchYears: editing?.churchYears || undefined,
        previousMinistry: editing?.previousMinistry || "",
        integrationYear: editing?.integrationYear || new Date().getFullYear(),
      });
      setSelectedFile(null);
    }
  }, [open, editing]);

  const handleFormSubmit = async () => {
    try {
      // Gerar título e descrição automaticamente baseado no nome da pessoa
      const mediaData = formData.name ? {
        title: `Foto da Integração - ${formData.name}`,
        description: `Foto da integração de ${formData.name} na Feira de Ministério`,
      } : undefined;

      const submitData = {
        ...formData,
        ...(mediaData && { media: mediaData }),
      };

      await onSubmit(submitData, selectedFile || undefined);
      onClose();
    } catch (error) {
      // Error is handled by parent component
    }
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          width: isMobile ? '98vw' : 'auto',
          height: isMobile ? '98vh' : 'auto',
          maxWidth: isMobile ? '98vw' : '900px',
          maxHeight: isMobile ? '98vh' : '90vh',
          margin: isMobile ? '1vh 1vw' : 'auto',
        },
      }}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
        <DialogTitle
          sx={{
            pb: isMobile ? 2 : 1,
            pt: isMobile ? 3 : 2,
            px: isMobile ? 3 : 3,
          }}
        >
          <Typography
            component="div"
            fontWeight="bold"
            sx={{
              fontSize: isMobile ? '1.5rem' : '1.25rem',
              textAlign: isMobile ? 'center' : 'left',
              fontFamily: 'inherit',
            }}
          >
            {editing ? "Editar Integração" : "Nova Integração"}
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            pt: isMobile ? 0 : 1,
            px: isMobile ? 3 : 3,
            pb: isMobile ? 2 : 2,
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: isMobile ? 3 : 2,
                mx: isMobile ? 0 : 0,
              }}
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={isMobile ? 2 : 3}>
            {/* Informações Pessoais */}
            <Grid item xs={12}>
              <Typography
                variant={isMobile ? "h6" : "subtitle1"}
                fontWeight="bold"
                gutterBottom
                sx={{
                  fontSize: isMobile ? '1.1rem' : '1rem',
                  mt: isMobile ? 1 : 0,
                  mb: isMobile ? 2 : 1,
                  color: 'primary.main',
                }}
              >
                👤 Informações Pessoais
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                placeholder="Nome da pessoa"
                value={formData.name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                placeholder="(11) 98765-4321"
                value={maskPhoneBR(formData.phone || "")}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: maskPhoneBR(e.target.value) }))}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: isMobile ? '1rem' : '0.875rem',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Líder de GA"
                placeholder="Nome do líder responsável"
                value={formData.gaLeader || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, gaLeader: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Ano da Integração"
                placeholder="2024"
                value={formData.integrationYear || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  integrationYear: e.target.value ? parseInt(e.target.value) : undefined
                }))}
              />
            </Grid>

            {/* Informações Religiosas */}
            <Grid item xs={12}>
              <Typography
                variant={isMobile ? "h6" : "subtitle1"}
                fontWeight="bold"
                gutterBottom
                sx={{
                  mt: isMobile ? 3 : 2,
                  mb: isMobile ? 2 : 1,
                  fontSize: isMobile ? '1.1rem' : '1rem',
                  color: 'primary.main',
                }}
              >
                🙏 Informações Religiosas
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.baptized || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, baptized: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Batizado"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Anos de Igreja"
                placeholder="5"
                value={formData.churchYears || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  churchYears: e.target.value ? parseInt(e.target.value) : undefined
                }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ministério Anterior"
                placeholder="Ex: Louvor, Intercessão, etc."
                value={formData.previousMinistry || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, previousMinistry: e.target.value }))}
              />
            </Grid>

            {/* Imagem */}
            <Grid item xs={12}>
              <Typography
                variant={isMobile ? "h6" : "subtitle1"}
                fontWeight="bold"
                gutterBottom
                sx={{
                  mt: isMobile ? 3 : 2,
                  mb: isMobile ? 2 : 1,
                  fontSize: isMobile ? '1.1rem' : '1rem',
                  color: 'primary.main',
                }}
              >
                📸 Foto da Integração (Opcional)
              </Typography>
              <Box sx={{ mt: isMobile ? 1 : 2 }}>
                <IntegrationImageUpload
                  onImageSelect={(file) => setSelectedFile(file)}
                  onError={(error) => {
                    // O erro será tratado pelo componente pai através do dialogError
                    console.error('Erro no upload:', error);
                  }}
                  currentImageUrl={editing?.image?.url}
                  personName={formData.name}
                />
              </Box>
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: isMobile ? 3 : 3,
            pb: isMobile ? 3 : 2,
            pt: isMobile ? 2 : 0,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1.5 : 1,
            '& > :not(:first-of-type)': {
              ml: isMobile ? 0 : 1,
            },
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            fullWidth={isMobile}
            sx={{
              minHeight: isMobile ? 48 : 36,
              fontSize: isMobile ? '1rem' : '0.875rem',
              fontWeight: 600,
              borderRadius: isMobile ? 2 : 1,
              order: isMobile ? 2 : 1,
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth={isMobile}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              minHeight: isMobile ? 48 : 36,
              fontSize: isMobile ? '1rem' : '0.875rem',
              fontWeight: 600,
              borderRadius: isMobile ? 2 : 1,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              },
              order: isMobile ? 1 : 2,
            }}
          >
            {loading ? "Salvando..." : (editing ? "Atualizar" : "Criar")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
