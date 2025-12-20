import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Paper,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
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

  // Detectar dispositivo e navegador
  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;
    
    // Detectar navegador
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(userAgent) && !isChrome;
    const isFirefox = /Firefox/.test(userAgent);
    
    return { isIOS, isAndroid, isMobile, isChrome, isSafari, isFirefox };
  };

  const handleCameraClick = async () => {
    const device = detectDevice();
    
    // Para iOS Safari, usar input com capture (mais confiável)
    if (device.isIOS && device.isSafari) {
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', 'environment');
        cameraInputRef.current.click();
      }
      return;
    }
    
    // Verificar se a API de MediaDevices está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback: usar input com capture
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', 'environment');
        cameraInputRef.current.click();
      } else {
        onError('Seu navegador não suporta acesso à câmera. Tente usar a opção de selecionar da galeria.');
      }
      return;
    }

    try {
      // Configuração de vídeo baseada no dispositivo
      const videoConstraints: MediaTrackConstraints = device.isMobile
        ? { 
            facingMode: { ideal: 'environment' }, // Câmera traseira
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        : { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints,
        audio: false
      });
      
      // Criar um canvas para capturar a foto
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Não foi possível criar o contexto do canvas');
      }
      
      // Criar um modal simples para mostrar a câmera
      const modal = document.createElement('div');
      modal.id = 'camera-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        padding: 20px;
        box-sizing: border-box;
      `;
      
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.style.cssText = `
        max-width: 100%;
        max-height: 70vh;
        border-radius: 8px;
        object-fit: contain;
        background: #000;
      `;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
      
      // Garantir que o vídeo esteja em landscape no mobile
      if (device.isMobile) {
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
      }
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        justify-content: center;
        width: 100%;
        max-width: 500px;
      `;
      
      const captureButton = document.createElement('button');
      captureButton.textContent = 'Capturar Foto';
      captureButton.style.cssText = `
        padding: 14px 28px;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        min-width: 140px;
        box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
      `;
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancelar';
      cancelButton.style.cssText = `
        padding: 14px 28px;
        background: #666;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        min-width: 140px;
      `;
      
      const retakeButton = document.createElement('button');
      retakeButton.textContent = 'Tirar Novamente';
      retakeButton.style.cssText = `
        padding: 14px 28px;
        background: #666;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        min-width: 140px;
      `;
      
      let videoReady = false;
      
      videoElement.addEventListener('loadedmetadata', () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        videoReady = true;
      });
      
      const cleanup = () => {
        stream.getTracks().forEach(track => {
          track.stop();
        });
        const existingModal = document.getElementById('camera-modal');
        if (existingModal) {
          document.body.removeChild(existingModal);
        }
      };
      
      captureButton.onclick = () => {
        if (!videoReady) {
          onError('Aguarde a câmera carregar completamente');
          return;
        }
        
        try {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
              setSelectedFile(file);
              setPreview(URL.createObjectURL(blob));
            } else {
              onError('Erro ao processar a imagem');
            }
          }, 'image/jpeg', 0.9);
          
          cleanup();
        } catch (err) {
          console.error('Erro ao capturar foto:', err);
          onError('Erro ao capturar a foto. Tente novamente.');
          cleanup();
        }
      };
      
      cancelButton.onclick = () => {
        cleanup();
      };
      
      retakeButton.onclick = () => {
        cleanup();
        // Abrir a câmera novamente após um pequeno delay
        setTimeout(() => handleCameraClick(), 300);
      };
      
      // Adicionar botões ao container
      buttonContainer.appendChild(retakeButton);
      buttonContainer.appendChild(captureButton);
      buttonContainer.appendChild(cancelButton);
      
      modal.appendChild(videoElement);
      modal.appendChild(buttonContainer);
      document.body.appendChild(modal);
      
      // Tratamento de erro do vídeo
      videoElement.onerror = () => {
        onError('Erro ao carregar a câmera. Tente novamente ou use a opção de selecionar da galeria.');
        cleanup();
      };
      
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      
      let errorMessage = 'Erro ao acessar a câmera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Permissão negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'Nenhuma câmera encontrada.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'A câmera está sendo usada por outro aplicativo.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Configurações da câmera não suportadas.';
      } else {
        errorMessage += 'Tente usar a opção de selecionar da galeria.';
      }
      
      onError(errorMessage);
      
      // Fallback: tentar usar input com capture
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', 'environment');
        cameraInputRef.current.click();
      }
    }
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
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
      
      // Atualizar o estado do Redux para atualizar o avatar na navbar
      try {
        await dispatch(fetchCurrentUser()).unwrap();
      } catch (err) {
        console.error('Erro ao atualizar usuário no Redux:', err);
      }
      
      // Atualizar o preview com a nova imagem
      if (updatedProfile.image?.url) {
        setPreview(updatedProfile.image.url);
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
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        }}
      >
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
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
              onClick={handleCameraClick}
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
                  if (cameraInputRef.current) {
                    cameraInputRef.current.value = '';
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
          <Alert severity="success" sx={{ mb: 2 }}>
            Imagem atualizada com sucesso!
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedFile}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
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
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
            },
          }}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Foto'}
        </Button>
      </Paper>
    </motion.div>
  );
};

export default ProfileImageUpload;

