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
};

interface IntegrationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIntegrationDto | UpdateIntegrationDto, files?: File[]) => Promise<void>;
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
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [deletedImages, setDeletedImages] = React.useState<Set<string>>(new Set());

  const [formData, setFormData] = React.useState<FormData>({
    name: editing?.name || "",
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: editing?.name || "",
      });
      setSelectedFiles([]);
    }
  }, [open, editing]);

  const handleImageDelete = (imageId: string) => {
    setDeletedImages(prev => new Set(prev).add(imageId));
  };

  const handleFormSubmit = async () => {
    try {
      let imagesData;

      if (editing) {
        // Modo edição: incluir imagens existentes + novas
        const existingImages = (editing.images || [])
          .filter(img => !deletedImages.has(img.id))
          .map(img => ({
            id: img.id,
            title: img.title,
            description: img.description,
            url: img.url,
          }));

        const newImages = selectedFiles.map((file, index) => ({
          title: formData.name ? `Foto ${existingImages.length + index + 1} - ${formData.name}` : `Foto ${existingImages.length + index + 1}`,
          description: formData.name
            ? `Foto da integração de ${formData.name} na Feira de Ministério`
            : "Foto da integração na Feira de Ministério",
          fieldKey: `files[${index}]`,
        }));

        imagesData = [...existingImages, ...newImages];
      } else {
        // Modo criação: apenas novas imagens
        imagesData = selectedFiles.length > 0 ? selectedFiles.map((file, index) => ({
          title: formData.name ? `Foto ${index + 1} - ${formData.name}` : `Foto ${index + 1}`,
          description: formData.name
            ? `Foto da integração de ${formData.name} na Feira de Ministério`
            : "Foto da integração na Feira de Ministério",
          fieldKey: `files[${index}]`,
        })) : undefined;
      }

      const submitData = {
        name: formData.name,
        integrationYear: editing ? editing.integrationYear : new Date().getFullYear(),
        ...(imagesData && imagesData.length > 0 && { images: imagesData }),
        ...(deletedImages.size > 0 && { deletedImageIds: Array.from(deletedImages) }),
      };

      await onSubmit(submitData, selectedFiles.length > 0 ? selectedFiles : undefined);
      onClose();
    } catch (error) {
      // Error handled by parent component
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
            <Grid item xs={12}>
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

            <Grid item xs={12}>
              <Typography
                variant={isMobile ? "h6" : "subtitle1"}
                fontWeight="bold"
                gutterBottom
                sx={{
                  mt: isMobile ? 2 : 1,
                  mb: isMobile ? 2 : 1,
                  fontSize: isMobile ? '1.1rem' : '1rem',
                  color: 'primary.main',
                }}
              >
                📸 Fotos para integração
              </Typography>
              <Box sx={{ mt: isMobile ? 1 : 2 }}>
                <IntegrationImageUpload
                  onImagesSelect={(files) => setSelectedFiles(prev => [...prev, ...files])}
                  onImageDelete={editing ? handleImageDelete : undefined}
                  onError={(error) => {
                    console.error('Erro no upload:', error);
                  }}
                  currentImages={(editing?.images || []).filter(img => !deletedImages.has(img.id))}
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
