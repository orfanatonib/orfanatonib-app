import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Container,
  Grid,
  Chip,
} from '@mui/material';
import { ArrowBack, Save, Public, Lock } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/slices';
import { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { setIdeasSectionData, clearIdeasSectionData } from '@/store/slices/ideas/ideasSlice';
import { IdeasMaterialSection } from '../IdeasMaterialPageCreator/IdeasMaterialSection';
import api from '@/config/axiosConfig';
import { motion } from 'framer-motion';

interface IdeasSectionAdminEditorProps {
  existingSection?: IdeasSection;
}

export function IdeasSectionAdminEditor({ existingSection }: IdeasSectionAdminEditorProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { ideasSectionData } = useSelector((state: RootState) => state.ideas);

  const [sectionData, setSectionData] = useState<IdeasSection>(
    existingSection || ideasSectionData || {
      title: '',
      description: '',
      medias: [],
      public: true,
    }
  );
  const [selectedPage, setSelectedPage] = useState<{ id: string; title: string } | null>(null);
  const [pages, setPages] = useState<{ id: string; title: string }[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ page: false });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    const loadPages = async () => {
      setPagesLoading(true);
      try {
        const res = await api.get('/ideas-pages');
        setPages(res.data || []);
      } catch {
        setSnackbar({
          open: true,
          message: 'Erro ao carregar páginas disponíveis',
          severity: 'error',
        });
      } finally {
        setPagesLoading(false);
      }
    };
    loadPages();
  }, []);

  const handleSectionUpdate = (updatedSection: IdeasSection) => {
    setSectionData(updatedSection);
  };

  const handleBack = () => {
    dispatch(clearIdeasSectionData());
    navigate('/adm/ideias-compartilhadas');
  };

  const handleSaveSection = async () => {
    setTouched({ page: true });

    if (!selectedPage) {
      setSnackbar({
        open: true,
        message: 'Por favor, selecione uma página de destino',
        severity: 'error',
      });
      return;
    }

    if (!existingSection?.id) {
      setSnackbar({
        open: true,
        message: 'ID da seção não encontrado',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      const mediaTypeCounters = { video: 0, document: 0, image: 0 };

      const mediasPayload = sectionData.medias.map((media) => {
        const baseItem = {
          title: media.title,
          description: media.description,
          mediaType: media.mediaType,
          uploadType: media.uploadType,
          isLocalFile: media.uploadType === 'upload',
        };

        if (media.uploadType === 'upload' && media.mediaType !== 'audio') {
          if (media.id && !media.file) {
            return {
              ...baseItem,
              id: media.id,
              url: media.url,
              originalName: media.originalName,
              size: media.size
            };
          }

          if (!media.file) {
            throw new Error(`Upload media "${media.title}" has no file associated`);
          }

          mediaTypeCounters[media.mediaType as keyof typeof mediaTypeCounters]++;
          const count = mediaTypeCounters[media.mediaType as keyof typeof mediaTypeCounters];
          const fieldKey = count === 1 ? `${media.mediaType}_upload` : `${media.mediaType}${count}_upload`;

          formData.append(fieldKey, media.file);

          if (media.id) {
            return {
              ...baseItem,
              id: media.id,
              fieldKey,
              originalName: media.file.name
            };
          }

          return { ...baseItem, fieldKey, originalName: media.file.name };
        }

        if (media.uploadType === 'link' && media.url) {
          if (media.id) {
            return {
              ...baseItem,
              id: media.id,
              url: media.url,
              platformType: media.platformType
            };
          }

          return {
            ...baseItem,
            url: media.url,
            platformType: media.platformType
          };
        }

        return baseItem;
      });

      const payloadData = {
        title: sectionData.title,
        description: sectionData.description,
        public: sectionData.public,
        medias: mediasPayload,
      };

      formData.append('sectionData', JSON.stringify(payloadData));

      await api.patch(`/ideas-sections/${existingSection.id}/attach/${selectedPage.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(clearIdeasSectionData());
      setSnackbar({
        open: true,
        message: 'Seção editada e vinculada com sucesso! 🎉',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/adm/ideias-compartilhadas');
      }, 2000);
    } catch {
      setSnackbar({
        open: true,
        message: 'Ops! Algo deu errado ao salvar a seção. Tente novamente.',
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
        bgcolor: 'background.default',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
            <IconButton
              onClick={handleBack}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              🔧 Editar Seção de Ideias
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper
            elevation={2}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              borderRadius: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              ⚙️ Configurações
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={touched.page && !selectedPage}>
                  <InputLabel>Página de Destino</InputLabel>
                  <Select
                    value={selectedPage?.id || ''}
                    label="Página de Destino"
                    onChange={(e) => {
                      const pageId = e.target.value;
                      const page = pages.find(p => p.id === pageId);
                      setSelectedPage(page || null);
                      if (touched.page) setTouched((prev) => ({ ...prev, page: false }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, page: true }))}
                    disabled={pagesLoading}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Selecione uma página...</em>
                    </MenuItem>
                    {pages.map((page) => (
                      <MenuItem key={page.id} value={page.id}>
                        {page.title}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.page && !selectedPage && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                      Campo obrigatório
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Visibilidade</InputLabel>
                  <Select
                    value={sectionData.public ? 'true' : 'false'}
                    label="Visibilidade"
                    onChange={(e) => {
                      const isPublic = e.target.value === 'true';
                      setSectionData({ ...sectionData, public: isPublic });
                    }}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="true">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Public fontSize="small" />
                        Público
                      </Box>
                    </MenuItem>
                    <MenuItem value="false">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lock fontSize="small" />
                        Privado
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {selectedPage && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: 'success.lighter',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Chip
                  icon={<Public />}
                  label="Página selecionada"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  <strong>{selectedPage.title}</strong>
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper
            elevation={2}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              borderRadius: 3,
              bgcolor: 'background.paper',
            }}
          >
            <IdeasMaterialSection
              section={sectionData}
              onUpdate={handleSectionUpdate}
              isCreationMode={false}
            />
          </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleBack}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                  bgcolor: 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSaveSection}
              disabled={loading || !selectedPage}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover:not(:disabled)': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                '&:disabled': {
                  opacity: 0.6,
                },
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Salvando...' : 'Salvar e Publicar'}
            </Button>
          </Box>
        </motion.div>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
