import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { clearIdeasSectionData } from '@/store/slices/ideas/ideasSlice';
import { IdeasMaterialSectionUser } from '../IdeasMaterialPageCreator/IdeasMaterialSectionUser';
import {
  buildIdeasSectionFormData,
  createIdeasSection,
  ideasSectionErrorMessage,
} from '@/features/ideas-sections';

export function IdeasSectionUserCreator() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [sectionData, setSectionData] = useState<IdeasSection>({
    title: '',
    description: '',
    medias: [],
    public: true,
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleSectionUpdate = (updatedSection: IdeasSection) => {
    setSectionData(updatedSection);
  };

  const handleBack = () => {
    dispatch(clearIdeasSectionData());
    navigate('/area-do-membro');
  };

  const handleShareIdea = async () => {
    if (!sectionData.title.trim()) {
      setSnackbar({
        open: true,
        message: 'Por favor, adicione um título para sua ideia',
        severity: 'error',
      });
      return;
    }

    if (!sectionData.description.trim()) {
      setSnackbar({
        open: true,
        message: 'Por favor, adicione uma descrição para sua ideia',
        severity: 'error',
      });
      return;
    }

    const validMedias = sectionData.medias.filter(media => {
      if (media.uploadType === 'upload') {
        return media.file && media.title.trim();
      }
      if (media.uploadType === 'link') {
        return media.url && media.title.trim();
      }
      return false;
    });

    if (validMedias.length === 0) {
      setSnackbar({
        open: true,
        message: 'Por favor, adicione pelo menos uma mídia (vídeo, imagem ou documento) para sua ideia',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // A ideia enviada por um membro nasce pública e sempre com mídia nova.
      await createIdeasSection(
        buildIdeasSectionFormData({
          title: sectionData.title,
          description: sectionData.description,
          public: true,
          medias: sectionData.medias,
        }),
      );

      dispatch(clearIdeasSectionData());

      setSectionData({
        title: '',
        description: '',
        medias: [],
        public: true,
      });

      setSnackbar({
        open: true,
        message: 'Sua ideia incrível foi compartilhada com sucesso! 🎉',
        severity: 'success',
      });

      setTimeout(() => {
        navigate('/area-do-membro');
      }, 2000);
    } catch (error: unknown) {
      setSnackbar({
        open: true,
        message: ideasSectionErrorMessage(
          error,
          'Ops! Algo deu errado ao compartilhar sua ideia. Tente novamente.',
        ),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Box sx={{
        py: { xs: 2, md: 3 },
        px: 0,
        flexShrink: 0,
        textAlign: 'center',
        position: 'relative',
      }}>
        <Box sx={{
          position: 'absolute',
          top: { xs: 8, md: 24 },
          left: { xs: 8, md: 24 },
          zIndex: 2,
        }}>
          <IconButton
            onClick={handleBack}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              width: { xs: '40px', md: '48px' },
              height: { xs: '40px', md: '48px' },
              fontSize: { xs: '1.2rem', md: '1.5rem' },
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.5rem' },
            mb: { xs: 3, md: 2 },
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            mt: { xs: 4, md: 5 },
            px: 0,
            maxWidth: '100%',
            mx: 0,
          }}
        >
          ✨ Criar e compartilhar ideia incrível
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
            mb: { xs: 4, md: 2 },
            maxWidth: '700px',
            mx: 'auto',
            lineHeight: 1.5,
            fontWeight: 400,
            textAlign: 'center',
          }}
        >
          Jesus colocou no seu coração uma ideia brilhante?<br />
          Pode ser uma brincadeira, um versículo, uma forma especial de contar<br />
          uma história ou qualquer outra atividade para o seu Abrigo!<br /><br />
          Agora você também pode enviar <strong>vídeos, imagens e documentos</strong><br />
          para mostrar como fez e ajudar outros membros a colocarem em prática. 📹📸📄
        </Typography>

      </Box>

      <Box sx={{
        flex: 1,
        p: { xs: 2, md: 4 },
        bgcolor: 'background.default',
        borderRadius: '24px 24px 0 0',
        position: 'relative',
        zIndex: 1,
      }}>
        <Box sx={{
          maxWidth: '1200px',
          mx: 'auto',
          bgcolor: 'background.paper',
          borderRadius: '20px',
          p: { xs: 2, md: 4 },
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          width: { xs: '98%', md: '95%' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '6px',
            bgcolor: 'divider',
            borderRadius: '3px',
          },
        }}>
          <IdeasMaterialSectionUser
            section={sectionData}
            onUpdate={handleSectionUpdate}
          />

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 4,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 2,
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: sectionData.medias.length > 0 ? 'success.50' : 'warning.50',
              border: `1px solid ${sectionData.medias.length > 0 ? 'success.main' : 'warning.main'}`,
              width: '100%',
              maxWidth: 400,
            }}>
              <Typography
                variant="body2"
                sx={{
                  color: sectionData.medias.length > 0 ? 'success.main' : 'warning.main',
                  fontWeight: 600,
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                {sectionData.medias.length > 0
                  ? `✅ ${sectionData.medias.length} mídia(s) adicionada(s)`
                  : '⚠️ Adicione pelo menos uma mídia (vídeo, imagem ou documento)'
                }
              </Typography>
            </Box>

            <Button
              data-testid="idea-share-submit"
              variant="contained"
              onClick={handleShareIdea}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{
                px: { xs: 4, md: 6 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '0.85rem', sm: '1.05rem', md: '1.2rem' },
                fontWeight: 'bold',
                borderRadius: '16px',
                bgcolor: 'primary.main',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(0,0,0,0.12)',
                  color: 'rgba(0,0,0,0.26)',
                },
                transition: 'all 0.3s ease',
                width: { xs: '95%', md: 'auto' },
                maxWidth: { xs: '300px', md: 'none' },
                opacity: sectionData.medias.length === 0 ? 0.6 : 1,
              }}
            >
              {loading ? 'Compartilhando...' : '🚀 Compartilhar Ideia'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 1400 }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: '12px',
            fontSize: '1rem',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
