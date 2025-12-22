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
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
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
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
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
        cameraInputRef.current.setAttribute('capture', cameraFacingMode);
        cameraInputRef.current.click();
      }
      return;
    }
    
    // Verificar se a API de MediaDevices está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback: usar input com capture
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', cameraFacingMode);
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
            facingMode: { ideal: cameraFacingMode }, // mobile: permite alternar selfie/traseira
            // Em mobile, portrait costuma ser mais natural para foto de perfil
            width: { ideal: 720 },
            height: { ideal: 1280 }
          }
        : { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints,
        audio: false
      });
      let activeStream: MediaStream = stream;
      let activeFacingMode: 'environment' | 'user' = cameraFacingMode;
      let activeDeviceId: string | undefined =
        activeStream.getVideoTracks?.()?.[0]?.getSettings?.()?.deviceId;
      
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
      
      // Wrapper para permitir máscara/overlay por cima do vídeo
      const videoWrapper = document.createElement('div');
      videoWrapper.style.cssText = `
        position: relative;
        width: ${device.isMobile ? 'min(92vw, 420px)' : 'min(92vw, 980px)'};
        aspect-ratio: ${device.isMobile ? '3 / 4' : '16 / 9'};
        border-radius: 16px;
        overflow: hidden;
        background: #000;
        box-shadow: 0 18px 60px rgba(0,0,0,0.55);
      `;

      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: #000;
      `;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
      
      // Garantir que o vídeo fique inline no mobile (evita fullscreen automático)
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

      // Ícone no canto superior direito para trocar câmera (somente mobile)
      const switchCameraIconButton = document.createElement('button');
      switchCameraIconButton.type = 'button';
      switchCameraIconButton.setAttribute('aria-label', 'Trocar câmera');
      switchCameraIconButton.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(0,0,0,0.55);
        color: white;
        display: ${device.isMobile ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 5;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      `;
      // SVG inline (não depende de libs/React no modal)
      switchCameraIconButton.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 6h-1.2l-1.1-1.3A2 2 0 0 0 12.2 4h-0.4a2 2 0 0 0-1.5.7L9.2 6H8a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4Z" stroke="white" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M8.5 12c1.2-1.2 3.3-1.2 4.5 0" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M10.3 10.2 8.5 12l1.8 1.8" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15.5 12c-1.2 1.2-3.3 1.2-4.5 0" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M13.7 13.8 15.5 12l-1.8-1.8" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      // Máscara de enquadramento (ombros pra cima) — versão mais clean (recorte SVG + guias)
      const maskOverlay = document.createElement('div');
      maskOverlay.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 4;
      `;
      const maskId = `cutout-${Date.now()}`;
      // Silhueta: cabeça + ombros (ombro pra cima)
      const silhouettePath = `
        M50 14
        a14 14 0 1 0 0 28
        a14 14 0 1 0 0 -28
        M18 98
        C18 76 31 62 50 62
        C69 62 82 76 82 98
        L18 98
        Z
      `;
      maskOverlay.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="rgba(255,255,255,0.35)" />
            </filter>
            <mask id="${maskId}">
              <rect x="0" y="0" width="100" height="100" fill="white"></rect>
              <path d="${silhouettePath}" fill="black"></path>
            </mask>
          </defs>

          <!-- escurecer fora do recorte -->
          <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.62)" mask="url(#${maskId})"></rect>

          <!-- borda da silhueta -->
          <path d="${silhouettePath}" fill="transparent"
                stroke="rgba(255,255,255,0.92)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"
                filter="url(#softGlow)"></path>

          <!-- guias discretas: olhos e ombros -->
          <line x1="32" y1="26" x2="68" y2="26" stroke="rgba(255,255,255,0.22)" stroke-width="0.8" />
          <line x1="26" y1="66" x2="74" y2="66" stroke="rgba(255,255,255,0.16)" stroke-width="0.8" />
        </svg>
      `;

      const hintBar = document.createElement('div');
      hintBar.textContent = 'Enquadre do ombro pra cima • olhos na linha';
      hintBar.style.cssText = `
        position: absolute;
        left: 12px;
        right: 60px;
        top: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%);
        color: rgba(255,255,255,0.94);
        font-size: 13px;
        font-weight: 650;
        letter-spacing: 0.2px;
        text-shadow: 0 1px 8px rgba(0,0,0,0.55);
        z-index: 6;
        pointer-events: none;
      `;
      
      let videoReady = false;
      
      videoElement.addEventListener('loadedmetadata', () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        videoReady = true;
      });
      
      const cleanup = () => {
        activeStream.getTracks().forEach(track => {
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

      switchCameraIconButton.onclick = async () => {
        if (!device.isMobile) return;
        const nextFacingMode: 'environment' | 'user' = activeFacingMode === 'environment' ? 'user' : 'environment';
        try {
          // parar stream atual antes de pedir o novo
          activeStream.getTracks().forEach(track => track.stop());
          videoReady = false;

          // Alguns devices/browsers ignoram facingMode. Tentamos primeiro escolher por deviceId via enumerateDevices.
          let nextStream: MediaStream | null = null;
          if (navigator.mediaDevices?.enumerateDevices) {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoInputs = devices.filter((d) => d.kind === 'videoinput');

              const wantFront = nextFacingMode === 'user';
              const frontRegex = /(front|user|facetime)/i;
              const backRegex = /(back|rear|environment)/i;

              const preferred = videoInputs.find((d) =>
                wantFront ? frontRegex.test(d.label) : backRegex.test(d.label)
              );

              // fallback: pegar qualquer outra câmera diferente da atual
              const fallbackOther = videoInputs.find((d) => d.deviceId && d.deviceId !== activeDeviceId);
              const chosen = preferred ?? fallbackOther;

              if (chosen?.deviceId) {
                nextStream = await navigator.mediaDevices.getUserMedia({
                  video: {
                    deviceId: { exact: chosen.deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  },
                  audio: false,
                });
              }
            } catch {
              // ignora e cai no facingMode
            }
          }

          if (!nextStream) {
            const nextConstraints: MediaTrackConstraints = {
              facingMode: { ideal: nextFacingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };
            nextStream = await navigator.mediaDevices.getUserMedia({
              video: nextConstraints,
              audio: false,
            });
          }

          activeStream = nextStream;
          activeFacingMode = nextFacingMode;
          setCameraFacingMode(nextFacingMode);
          activeDeviceId = activeStream.getVideoTracks?.()?.[0]?.getSettings?.()?.deviceId;
          videoElement.srcObject = activeStream;
        } catch (err: any) {
          console.error('Erro ao trocar câmera:', err);
          onError('Não foi possível trocar a câmera. Seu dispositivo pode não ter câmera frontal ou o navegador bloqueou.');
          // tentar voltar para a câmera anterior
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: activeFacingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false,
            });
            activeStream = fallbackStream;
            activeDeviceId = activeStream.getVideoTracks?.()?.[0]?.getSettings?.()?.deviceId;
            videoElement.srcObject = activeStream;
          } catch {
            cleanup();
          }
        }
      };
      
      // Adicionar botões ao container
      buttonContainer.appendChild(captureButton);
      buttonContainer.appendChild(cancelButton);
      
      // Montagem do modal
      videoWrapper.appendChild(videoElement);
      videoWrapper.appendChild(maskOverlay);
      videoWrapper.appendChild(hintBar);
      videoWrapper.appendChild(switchCameraIconButton);
      modal.appendChild(videoWrapper);
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
        cameraInputRef.current.setAttribute('capture', cameraFacingMode);
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

