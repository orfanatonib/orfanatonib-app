import { logger } from '@/utils/logger';
import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CameraModal from '../../../components/common/CameraModal';
import ImagePreviewDialog from '../../../components/common/ImagePreviewDialog';
import { apiUpdateProfileImage } from '../api';
import { fetchCurrentUser } from '@/store/slices/auth/authSlice';
import type { AppDispatch } from '@/store/slices';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { acceptAttribute, formatFileSize, validateUploadFile } from '@/utils/mediaUpload';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onUpdate: () => void;
  onError: (error: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onUpdate,
  onError,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tipo e tamanho são conferidos ANTES do envio (a API repete a checagem e confere os bytes).
    const check = validateUploadFile(file, 'image');
    if (!check.ok) {
      onError(check.message);
      e.target.value = '';
      return;
    }
    onError('');

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (file: File) => {
    const check = validateUploadFile(file, 'image');
    if (!check.ok) {
      onError(check.message);
      return;
    }
    onError('');
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };


  const handleSubmit = async () => {
    setSuccess(false);
    onError('');

    if (!selectedFile) {
      onError('Por favor, selecione uma imagem');
      return;
    }

    setIsSubmitting(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('imageData', JSON.stringify({
        title: 'Foto de Perfil',
        description: 'Foto de perfil do usuário',
        uploadType: 'UPLOAD',
        isLocalFile: true,
      }));
      formData.append('file', selectedFile);

      const updatedProfile = await apiUpdateProfileImage(formData, setProgress);
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      try {
        await dispatch(fetchCurrentUser()).unwrap();
      } catch (error: unknown) {
        // A foto já foi salva; o usuário em memória se atualiza na próxima navegação.
        logger.warn('Não foi possível recarregar o usuário após trocar a foto', { feature: 'profile' }, error);
      }

      const newImage = updatedProfile.image || (updatedProfile.mediaItems && updatedProfile.mediaItems.length > 0 ? updatedProfile.mediaItems[0] : null);

      if (newImage?.url) {
        setPreview(newImage.url);
      }

      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err, 'Erro ao fazer upload da imagem');
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box data-testid="profile-image-upload" sx={{ width: '100%' }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Avatar
            data-testid="profile-image-avatar"
            src={preview || currentImageUrl}
            onClick={() => {
              const imageUrl = preview || currentImageUrl;
              if (imageUrl) setPreviewImage(imageUrl);
            }}
            sx={{
              width: { xs: 120, sm: 150, md: 180 },
              height: { xs: 120, sm: 150, md: 180 },
              fontSize: { xs: '3rem', md: '4rem' },
              bgcolor: 'primary.main',
              border: '4px solid white',
              boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
              mx: 'auto',
              mb: 2,
              cursor: (preview || currentImageUrl) ? 'pointer' : 'default',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': (preview || currentImageUrl) ? {
                transform: 'scale(1.02)',
                boxShadow: '0 12px 32px rgba(25, 118, 210, 0.4)',
              } : {},
            }}
          >
            {!preview && !currentImageUrl && 'U'}
          </Avatar>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sua foto de perfil será exibida em todo o sistema
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            data-testid="profile-image-input"
            accept={acceptAttribute('image')}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Stack spacing={2}>
            <Button
              data-testid="profile-image-select"
              variant="outlined"
              fullWidth
              startIcon={<CloudUploadIcon />}
              onClick={() => {
                fileInputRef.current?.click();
              }}
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
              data-testid="profile-image-camera"
              variant="outlined"
              fullWidth
              startIcon={<CameraAltIcon />}
              onClick={() => setCameraOpen(true)}
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
              Abrir Câmera
            </Button>
          </Stack>
          {selectedFile && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography
                data-testid="profile-image-selected"
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1, wordBreak: 'break-all' }}
              >
                Arquivo selecionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </Typography>
              <Button
                data-testid="profile-image-remove"
                variant="text"
                size="small"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(currentImageUrl || null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                sx={{
                  textTransform: 'none',
                  color: 'primary.main',
                  fontSize: '0.75rem',
                  minHeight: 44,
                }}
              >
                Remover e escolher outra
              </Button>
            </Box>
          )}
        </Box>

        {success && (
          <Alert data-testid="profile-image-success" severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Imagem atualizada com sucesso!
          </Alert>
        )}

        {isSubmitting && (
          <Box data-testid="profile-image-progress" sx={{ mb: 2 }}>
            <LinearProgress
              variant={progress > 0 ? 'determinate' : 'indeterminate'}
              value={progress}
              aria-label="Progresso do envio"
            />
            <Typography
              data-testid="profile-image-progress-label"
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
            >
              {progress > 0 ? `Enviando ${progress}%` : 'Enviando...'}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
          <Button
            data-testid="profile-image-submit"
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedFile}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
            sx={{
              maxWidth: { xs: '100%', sm: 200 },
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
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
              },
            }}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Foto'}
          </Button>
        </Box>

        <CameraModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCameraCapture}
          onError={onError}
          variant="profile"
        />

        <ImagePreviewDialog
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
          alt="Foto de Perfil"
        />
      </Box>
    </motion.div>
  );
};

export default ProfileImageUpload;
