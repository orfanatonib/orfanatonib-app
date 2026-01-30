import React, { useState, useRef, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ImageCarouselDialog, { CarouselImage } from './ImageCarouselDialog';
import CameraModal from '../../../components/Common/CameraModal';

interface IntegrationImageUploadProps {
  onImagesSelect: (files: File[]) => void;
  onImageDelete?: (imageId: string) => void;
  onError: (error: string) => void;
  currentImages?: Array<{ id?: string; url?: string; title?: string; }>;
  personName?: string;
}

const IntegrationImageUpload: React.FC<IntegrationImageUploadProps> = ({
  onImagesSelect,
  onImageDelete,
  onError,
  currentImages = [],
  personName,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);

  const allImages = useMemo<CarouselImage[]>(() => {
    const existing: CarouselImage[] = currentImages.map(img => ({
      url: img.url || '',
      title: img.title || 'Imagem existente',
    }));

    const newFiles: CarouselImage[] = selectedFiles.map(file => ({
      url: URL.createObjectURL(file),
      title: 'Nova imagem',
    }));

    return [...existing, ...newFiles];
  }, [currentImages, selectedFiles]);

  const handlePreview = (index: number) => {
    setPreviewStartIndex(index);
    setPreviewOpen(true);
  };

  const title = personName
    ? `Foto da Integração - ${personName}`
    : "Foto da Integração";


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        errors.push(`Arquivo ${index + 1}: Por favor, selecione apenas arquivos de imagem`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors.push(`Arquivo ${index + 1}: O arquivo deve ter no máximo 5MB`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      onError(errors.join('\n'));
      return;
    }

    const totalImages = currentImages.length + selectedFiles.length + validFiles.length;
    if (totalImages > 5) {
      onError(`Máximo de 5 imagens por integração. Você já tem ${currentImages.length} e está tentando adicionar ${validFiles.length} mais.`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    onImagesSelect(validFiles);
  };


  const handleCameraCapture = (file: File) => {
    const totalImages = currentImages.length + selectedFiles.length + 1;
    if (totalImages > 5) {
      onError(`Máximo de 5 imagens por integração. Você já tem ${currentImages.length + selectedFiles.length} imagens.`);
      return;
    }

    setSelectedFiles(prev => [...prev, file]);
    onImagesSelect([file]);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{ width: '100%' }}>
        {(currentImages.length > 0 || selectedFiles.length > 0) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Imagens Selecionadas ({currentImages.length + selectedFiles.length}/5)
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {currentImages.map((image, index) => (
                <Box key={`current-${image.id || index}`} sx={{ position: 'relative' }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.title || `Imagem ${index + 1}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        display: 'block',
                      }}
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(image.id || `current-${index}`));
                      }}
                    />

                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.3)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        '&:hover': { opacity: 1 },
                      }}
                      onClick={() => handlePreview(index)}
                    >
                      <ZoomInIcon sx={{ color: 'white' }} />
                    </Box>

                    <Chip
                      label="Atual"
                      size="small"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: '0.6rem',
                        height: '16px',
                      }}
                    />
                    {onImageDelete && image.id && (
                      <IconButton
                        size="small"
                        onClick={() => onImageDelete(image.id!)}
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          left: 4,
                          bgcolor: 'rgba(244, 67, 54, 0.8)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.9)' },
                          width: '28px',
                          height: '28px',
                          zIndex: 10,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '18px' }} />
                      </IconButton>
                    )}
                  </Paper>
                </Box>
              ))}

              {selectedFiles.map((file, index) => (
                <Box key={`selected-${index}`} sx={{ position: 'relative' }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: '#e8f5e9',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Nova imagem ${index + 1}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        display: 'block',
                      }}
                    />

                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.3)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        '&:hover': { opacity: 1 },
                      }}
                      onClick={() => handlePreview(currentImages.length + index)}
                    >
                      <ZoomInIcon sx={{ color: 'white' }} />
                    </Box>

                    <Chip
                      label="Nova"
                      size="small"
                      color="success"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: '0.6rem',
                        height: '16px',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                        width: '28px',
                        height: '28px',
                        zIndex: 10,
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '14px' }} />
                    </IconButton>
                  </Paper>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />


        <CameraModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCameraCapture}
          onError={onError}
        />

        {isMobile ? (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            <IconButton
              color="primary"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: 64,
                height: 64,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: '16px',
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 32 }} />
            </IconButton>

            <IconButton
              color="primary"
              onClick={() => setCameraOpen(true)}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              <CameraAltIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>
        ) : (
          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                },
              }}
            >
              Selecionar da Galeria
            </Button>

            <Button
              variant="contained"
              fullWidth
              startIcon={<CameraAltIcon />}
              onClick={() => setCameraOpen(true)}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              Tirar Foto com Câmera
            </Button>
          </Stack>
        )}

        {selectedFiles.length > 0 && (
          <Button
            variant="text"
            size="small"
            fullWidth
            onClick={() => setSelectedFiles([])}
            sx={{
              mt: 1,
              textTransform: 'none',
              color: 'text.secondary',
              fontSize: '0.8rem',
            }}
          >
            Limpar seleções ({selectedFiles.length})
          </Button>
        )}


      </Box>

      <ImageCarouselDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={allImages}
        title={title}
        startIndex={previewStartIndex}
      />
    </motion.div>
  );
};

export default IntegrationImageUpload;
