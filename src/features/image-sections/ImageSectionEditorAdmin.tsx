import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';

import api from '@/config/axiosConfig';
import { setData, clearData, SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { MediaType, MediaUploadType, MediaPlatform } from '@/store/slices/types';
import { RootState } from '@/store/slices';

import { LoadingSpinner } from '@/pages/TeacherArea/components/Modals';
import { NotificationModal } from '@/pages/TeacherArea/components/Modals';
import ImageSectionEditor from '@/pages/TeacherArea/ImageSection/ImageSectionEditor';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export default function ImageSectionEditorAdmin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const sectionData = useSelector((state: RootState) => state.imageSection.data) as SectionData | null;

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showError = (message: string) => {
    setNotification({ open: true, message, severity: 'error' });
  };

  const validate = useCallback((): boolean => {
    if (!sectionData?.caption?.trim()) {
      showError('O título da galeria compartilhada é obrigatório.');
      return false;
    }
    if (!sectionData?.description?.trim()) {
      showError('A descrição das atividades do Abrigo é obrigatória.');
      return false;
    }
    if (!sectionData?.mediaItems?.length) {
      showError('É necessário ter pelo menos uma imagem para publicar.');
      return false;
    }
    return true;
  }, [sectionData]);

  const prepareFormData = useCallback((): FormData => {
    const formData = new FormData();

    const mediaItems = sectionData!.mediaItems.map((media, index) => {
      const base = {
        isLocalFile: media.isLocalFile,
        url: media.url || '',
        uploadType: media.uploadType || MediaUploadType.UPLOAD,
        mediaType: MediaType.IMAGE,
        title: media.title || '',
        description: media.description || '',
        platformType: media.platformType || MediaPlatform.ANY,
        originalName: media.originalName,
        size: media.size,
      };

      if (media.isLocalFile && media.file) {
        const fieldKey = `file_${index}`;
        formData.append(fieldKey, media.file);
        return { ...base, fieldKey, id: media.id };
      }

      return { ...base, id: media.id };
    });

    const payload = {
      caption: sectionData!.caption,
      description: sectionData!.description,
      public: sectionData!.public,
      mediaItems,
    };

    formData.append('sectionData', JSON.stringify(payload));
    return formData;
  }, [sectionData]);

  const saveSection = async (formData: FormData) => {
    if (!sectionData?.id) {
      showError('ID da seção não encontrado.');
      return;
    }

    await api.patch(`/image-sections/${sectionData.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    setNotification({
      open: true,
      message: 'Imagens compartilhadas publicadas com sucesso!',
      severity: 'success',
    });

    dispatch(clearData());
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    const formData = prepareFormData();

    try {
      await saveSection(formData);
      navigate('/adm/fotos-abrigos');
    } catch (error) {
      console.error('Erro ao salvar a seção:', error);
      showError('Falha ao publicar as imagens compartilhadas. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (updatedData: Partial<SectionData>) => {
    dispatch(setData({ ...(sectionData || {}), ...updatedData } as SectionData));
  };

  // Se não há dados para editar, redireciona para o manager
  useEffect(() => {
    if (!sectionData) {
      navigate('/adm/fotos-abrigos');
    }
  }, [sectionData, navigate]);

  if (!sectionData) {
    return null; // Evita flash de conteúdo antes do redirecionamento
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa',
        py: { xs: 1, md: 2 },
        px: { xs: 0.5, md: 0 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, md: 2 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header Administrativo */}
          <Paper
            elevation={2}
            sx={{
              mb: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              color: 'white',
            }}
          >
            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    mb: 0.5,
                  }}
                >
                  🛠️ Editor de Imagens Compartilhadas
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: '0.8rem', md: '0.85rem' },
                  }}
                >
                  Editar e publicar imagens compartilhadas dos Abrigos
                </Typography>
              </Box>
              
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: { xs: 'row', sm: 'row' },
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate('/adm/fotos-abrigos')}
                  disabled={isSaving}
                  size="small"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    fontSize: '0.8rem',
                  }}
                >
                  ← Voltar
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSaving}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {isSaving ? 'Publicando...' : '💾 Publicar Alterações'}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Painel Principal */}
          <Paper
            elevation={1}
            sx={{
              p: { xs: 1.5, md: 2 },
              borderRadius: 2,
              bgcolor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >

            <LoadingSpinner open={isSaving} aria-label="Salvando a seção" />

            <NotificationModal
              open={notification.open}
              message={notification.message}
              severity={notification.severity}
              onClose={() => setNotification({ ...notification, open: false })}
            />

            {/* Informações da Seção */}
            <Box
              sx={{
                mb: 3,
                p: 0,
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  bgcolor: sectionData?.public ? '#f0fdf4' : '#fef2f2',
                  borderRadius: 2,
                  border: sectionData?.public ? '2px solid #86efac' : '2px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: sectionData?.public ? '#22c55e' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  {sectionData?.public ? '🌐' : '🔒'}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                    Status
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: sectionData?.public ? '#16a34a' : '#dc2626',
                      fontWeight: 700,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                    }}
                  >
                    {sectionData?.public ? 'Público' : 'Privado'}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  bgcolor: '#eff6ff',
                  borderRadius: 2,
                  border: '2px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  📸
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                    Imagens Compartilhadas
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#1e40af',
                      fontWeight: 700,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                    }}
                  >
                    {sectionData?.mediaItems?.length || 0} {sectionData?.mediaItems?.length === 1 ? 'imagem' : 'imagens'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ImageSectionEditor
                isEditMode={true}
                initialCaption={sectionData?.caption || ''}
                initialDescription={sectionData?.description || ''}
                initialIsPublic={sectionData?.public ?? true}
                initialMediaItems={sectionData?.mediaItems || []}
                onChange={handleChange}
                captionPlaceholder="EX: Abrigo 90: Gincana de Páscoa - Abrigados aprendendo sobre ressurreição"
                descriptionPlaceholder="EX: Revisar e aprimorar a descrição das atividades do Abrigo: dinâmicas, brincadeiras, ensinamentos bíblicos e momentos especiais registrados."
              />
            </motion.div>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
