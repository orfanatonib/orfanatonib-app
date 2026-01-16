import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import { motion } from 'framer-motion';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;

    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(userAgent) && !isChrome;
    const isFirefox = /Firefox/.test(userAgent);

    return { isIOS, isAndroid, isMobile, isChrome, isSafari, isFirefox };
  };

  const handleCameraClick = async () => {
    const device = detectDevice();

    if (device.isIOS && device.isSafari) {
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', cameraFacingMode);
        cameraInputRef.current.click();
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', cameraFacingMode);
        cameraInputRef.current.click();
      } else {
        onError('Seu navegador não suporta acesso à câmera. Tente usar a opção de selecionar da galeria.');
      }
      return;
    }

    try {
      const videoConstraints: MediaTrackConstraints = device.isMobile
        ? {
            facingMode: { ideal: cameraFacingMode },
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

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Não foi possível criar o contexto do canvas');
      }

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
        padding: ${device.isMobile ? '12px' : '20px'};
        box-sizing: border-box;
      `;

      const videoWrapper = document.createElement('div');
      videoWrapper.style.cssText = `
        position: relative;
        width: ${device.isMobile ? 'min(96vw, 440px)' : 'min(92vw, 980px)'};
        aspect-ratio: ${device.isMobile ? '9 / 16' : '16 / 9'};
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

      const switchCameraIconButton = document.createElement('button');
      switchCameraIconButton.type = 'button';
      switchCameraIconButton.setAttribute('aria-label', 'Trocar câmera');
      switchCameraIconButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 58px;
        height: 58px;
        border-radius: 999px;
        border: 1.5px solid rgba(255,255,255,0.45);
        background: rgba(0,0,0,0.82);
        color: white;
        display: ${device.isMobile ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 7;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        box-shadow: 0 12px 28px rgba(0,0,0,0.55);
      `;
      switchCameraIconButton.innerHTML = `
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 7h4V3" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 7a8 8 0 0 1 13 3" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 17h-4v4" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 17a8 8 0 0 1-13-3" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
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
              const file = new File([blob], `integracao-${Date.now()}.jpg`, { type: 'image/jpeg' });

              const totalImages = currentImages.length + selectedFiles.length + 1;
              if (totalImages > 5) {
                onError(`Máximo de 5 imagens por integração. Você já tem ${currentImages.length + selectedFiles.length} imagens.`);
                cleanup();
                return;
              }

              setSelectedFiles(prev => [...prev, file]);
              onImagesSelect([file]);
            } else {
              onError('Erro ao processar a imagem');
            }
          }, 'image/jpeg', 0.9);

          cleanup();
        } catch {
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
          activeStream.getTracks().forEach(track => track.stop());
          videoReady = false;

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
        } catch {
          onError('Não foi possível trocar a câmera. Seu dispositivo pode não ter câmera frontal ou o navegador bloqueou.');
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

      buttonContainer.appendChild(captureButton);
      buttonContainer.appendChild(cancelButton);

      videoWrapper.appendChild(videoElement);
      videoWrapper.appendChild(switchCameraIconButton);
      modal.appendChild(videoWrapper);
      modal.appendChild(buttonContainer);
      document.body.appendChild(modal);

      videoElement.onerror = () => {
        onError('Erro ao carregar a câmera. Tente novamente ou use a opção de selecionar da galeria.');
        cleanup();
      };

    } catch (err: any) {
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

      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', cameraFacingMode);
        cameraInputRef.current.click();
      }
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
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
                          width: '20px',
                          height: '20px',
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '14px' }} />
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
                        width: '20px',
                        height: '20px',
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

          {selectedFiles.length > 0 && (
            <Button
              variant="text"
              size="small"
              onClick={() => setSelectedFiles([])}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.8rem',
              }}
            >
              Limpar seleções ({selectedFiles.length})
            </Button>
          )}
          <Button
            variant="contained"
            fullWidth
            startIcon={<CameraAltIcon />}
            onClick={handleCameraClick}
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


      </Box>
    </motion.div>
  );
};

export default IntegrationImageUpload;
