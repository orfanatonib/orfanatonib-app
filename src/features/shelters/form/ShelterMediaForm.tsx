import React, { Fragment } from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Button, Box, IconButton, Card, CardMedia } from '@mui/material';
import { CloudUpload, Link as LinkIcon, Image as ImageIcon, Close as CloseIcon } from '@mui/icons-material';

interface Props {
  uploadType: "upload" | "link";
  setUploadType: (v: "upload" | "link") => void;
  url: string;
  setUrl: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  existingImageUrl?: string;
  onRemoveExistingImage?: () => void;
  onUrlChange?: (url: string) => void;
  onFileChange?: (file: File | null) => void;
}

const ShelterMediaForm: React.FC<Props> = ({
  uploadType, setUploadType, url, setUrl, file, setFile, existingImageUrl, onRemoveExistingImage, onUrlChange, onFileChange,
}) => {
  const [showExisting, setShowExisting] = React.useState(!!existingImageUrl);
  const previewUrl = file ? URL.createObjectURL(file) : (uploadType === "link" && url ? url : null);

  // Resetar showExisting quando existingImageUrl mudar
  React.useEffect(() => {
    setShowExisting(!!existingImageUrl);
  }, [existingImageUrl]);

  // Se tem imagem existente e não foi removida, mostrar apenas a imagem com botão X
  if (showExisting && existingImageUrl && !file && (!url || url === existingImageUrl)) {
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
          <Card sx={{ position: 'relative', borderRadius: 2 }}>
            <CardMedia
              component="img"
              image={existingImageUrl}
              alt="Imagem atual do abrigo"
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: 300,
                objectFit: "cover",
              }}
            />
            <IconButton
              onClick={() => {
                setShowExisting(false);
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
                '&:hover': {
                  bgcolor: 'error.dark',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
                boxShadow: 2,
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
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
              }}
            >
              Clique no "X" para remover e adicionar nova imagem
            </Box>
          </Card>
        </Grid>
      </Fragment>
    );
  }

  // Formulário normal de seleção de mídia
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
        <FormControl fullWidth>
          <InputLabel>Tipo de Imagem</InputLabel>
          <Select 
            value={uploadType} 
            label="Tipo de Imagem" 
            onChange={(e) => {
              setUploadType(e.target.value as "upload" | "link");
              // Limpar campos ao trocar de tipo
              if (e.target.value === "upload") {
                setUrl("");
              } else {
                setFile(null);
              }
            }}
          >
            <MenuItem value="upload">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUpload fontSize="small" />
                Upload (Enviar arquivo)
              </Box>
            </MenuItem>
            <MenuItem value="link">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon fontSize="small" />
                Link (URL externa - Unsplash, etc)
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {uploadType === "link" && (
        <Grid item xs={12}>
          <Box
            component="input"
            type="text"
            value={url}
            onChange={(e: any) => {
              const newUrl = e.target.value;
              setUrl(newUrl);
              if (onUrlChange) onUrlChange(newUrl);
            }}
            placeholder="https://images.unsplash.com/photo-..."
            sx={{
              width: '100%',
              padding: '16.5px 14px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              outline: 'none',
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: 'rgba(0, 0, 0, 0.87)',
              },
              '&:focus': {
                borderColor: 'primary.main',
                borderWidth: '2px',
                padding: '15.5px 13px',
              },
            }}
          />
          <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary', pl: 1.75 }}>
            Cole o link da imagem (ex: Unsplash, Google Drive, etc)
          </Box>
        </Grid>
      )}

      {uploadType === "upload" && (
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
      )}

      {/* Preview da Imagem */}
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

