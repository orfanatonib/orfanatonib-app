import React, { Fragment } from 'react';
import { Grid, Button, Box, IconButton, Card, CardMedia, Typography } from '@mui/material';
import { CloudUpload, Image as ImageIcon, Close as CloseIcon } from '@mui/icons-material';

interface Props {
  file: File | null;
  setFile: (f: File | null) => void;
  existingImageUrl?: string;
  onRemoveExistingImage?: () => void;
  onFileChange?: (file: File | null) => void;
}

const ShelterMediaForm: React.FC<Props> = ({
  file, setFile, existingImageUrl, onRemoveExistingImage, onFileChange,
}) => {
  const [showExisting, setShowExisting] = React.useState(!!existingImageUrl);
  const [imageError, setImageError] = React.useState(false);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  React.useEffect(() => {
    setShowExisting(!!existingImageUrl);
    setImageError(false);
  }, [existingImageUrl]);

  if (showExisting && existingImageUrl && !file) {
    return (
      <Fragment>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ImageIcon color="primary" />
            <Box component="h4" sx={{ m: 0, fontSize: "1rem", fontWeight: 600 }}>
              Imagem Atual do Abrigo
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ position: 'relative', borderRadius: 2, border: imageError ? '2px solid' : 'none', borderColor: imageError ? 'error.main' : 'transparent' }}>
            {imageError ? (
              <Box
                sx={{
                  width: "100%",
                  minHeight: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  gap: 2,
                  py: 3,
                }}
              >
                <ImageIcon sx={{ fontSize: 60, color: 'error.main' }} />
                <Typography variant="body1" color="error.main" fontWeight={600}>
                  Erro ao carregar a imagem
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" px={2}>
                  A imagem não pôde ser carregada. Clique no "X" para remover e adicionar uma nova.
                </Typography>
              </Box>
            ) : (
              <CardMedia
                component="img"
                image={existingImageUrl}
                alt="Imagem atual do abrigo"
                onError={() => setImageError(true)}
                sx={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 300,
                  objectFit: "cover",
                }}
              />
            )}
            <IconButton
              onClick={() => {
                setShowExisting(false);
                setImageError(false);
                if (onRemoveExistingImage) {
                  onRemoveExistingImage();
                }
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'error.main',
                color: 'white',
                zIndex: 10,
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                '&:hover': {
                  bgcolor: 'error.dark',
                  transform: 'scale(1.15)',
                },
                transition: 'all 0.2s',
                boxShadow: 4,
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </IconButton>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: "rgba(0,0,0,0.7)",
                color: "white",
                p: 1,
                fontSize: '0.875rem',
                zIndex: 5,
              }}
            >
              Clique no "X" para remover e adicionar nova imagem
            </Box>
          </Card>
        </Grid>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ImageIcon color="primary" />
          <Box component="h4" sx={{ m: 0, fontSize: "1rem", fontWeight: 600 }}>
            Imagem do Abrigo
          </Box>
        </Box>
      </Grid>
        
        <Grid item xs={12}>
          <Button
            component="label"
            variant="outlined"
            fullWidth
            startIcon={<CloudUpload />}
            sx={{
              py: 2,
              borderRadius: 2,
              borderStyle: 'dashed',
              borderWidth: 2,
            }}
          >
            {file ? file.name : 'Selecionar Imagem (JPG, PNG, GIF, WebP)'}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const newFile = e.target.files?.[0] || null;
                setFile(newFile);
                if (onFileChange) onFileChange(newFile);
              }}
            />
          </Button>
          {file && (
            <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
              Tamanho: {(file.size / 1024 / 1024).toFixed(2)} MB
            </Box>
          )}
        </Grid>

      {previewUrl && (
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 1,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}>
            <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.secondary' }}>
              Preview:
            </Box>
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: 300,
                borderRadius: 2,
                objectFit: 'contain',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>
        </Grid>
      )}
    </Fragment>
  );
};

export default ShelterMediaForm;

