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
} from '@mui/material';
import { motion } from 'framer-motion';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import CameraModal from '../../../components/Common/CameraModal';
import { apiUpdateProfileImage } from '../api';
import { fetchCurrentUser } from '@/store/slices/auth/authSlice';
import type { AppDispatch } from '@/store/slices';

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
  const [success, setSuccess] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (file: File) => {
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
    try {
      const formData = new FormData();
      formData.append('imageData', JSON.stringify({
        title: 'Foto de Perfil',
        description: 'Foto de perfil do usuário',
        uploadType: 'UPLOAD',
        isLocalFile: true,
      }));
      formData.append('file', selectedFile);

      const updatedProfile = await apiUpdateProfileImage(formData);
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      try {
        await dispatch(fetchCurrentUser()).unwrap();
      } catch {
      }

      const newImage = updatedProfile.image || (updatedProfile.mediaItems && updatedProfile.mediaItems.length > 0 ? updatedProfile.mediaItems[0] : null);

      if (newImage?.url) {
        setPreview(newImage.url);
      }

      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Erro ao fazer upload da imagem';
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Avatar
            src={preview || currentImageUrl}
            sx={{
              width: { xs: 120, sm: 150, md: 180 },
              height: { xs: 120, sm: 150, md: 180 },
              fontSize: { xs: '3rem', md: '4rem' },
              bgcolor: 'primary.main',
              border: '4px solid white',
              boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
              mx: 'auto',
              mb: 2,
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
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Stack spacing={2}>
            <Button
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
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
              <Button
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
                }}
              >
                Remover e escolher outra
              </Button>
            </Box>
          )}
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Imagem atualizada com sucesso!
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
          <Button
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
      </Box>
    </motion.div>
  );
};

export default ProfileImageUpload;
