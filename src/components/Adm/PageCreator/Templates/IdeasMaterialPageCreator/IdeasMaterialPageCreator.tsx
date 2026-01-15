import { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Container,
  Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'store/slices';
import { fetchRoutes } from 'store/slices/route/routeSlice';
import { clearIdeasData, IdeasSection } from 'store/slices/ideas/ideasSlice';
import api from '@/config/axiosConfig';
import { MediaUploadType } from 'store/slices/types';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { IdeasMaterialSection } from './IdeasMaterialSection';

interface PageCreatorProps {
  fromTemplatePage?: boolean;
}

export function IdeasMaterialPageCreator({ fromTemplatePage }: PageCreatorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const ideasData = useSelector((state: RootState) => state.ideas.ideasData);

  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [sections, setSections] = useState<IdeasSection[]>([]);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ title: false, description: false });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (fromTemplatePage) {
      dispatch(clearIdeasData());
      setPageTitle('');
      setPageDescription('');
      setSections([]);
    } else if (ideasData) {
      setPageTitle(ideasData.title || '');
      setPageDescription(ideasData.description || '');
      setSections(ideasData.sections || []);
    }
  }, [fromTemplatePage, ideasData, dispatch]);

  const errors = useMemo(() => ({
    title: !pageTitle.trim(),
    description: !pageDescription.trim(),
    sections: sections.length === 0,
  }), [pageTitle, pageDescription, sections]);

  const handleAddSection = () => {
    const newSection: IdeasSection = {
      title: '',
      description: '',
      medias: [],
    };
    setSections((prev) => [...prev, newSection]);
    setExpandedSectionIndex(sections.length);
  };

  const handleUpdateSection = (index: number, updatedSection: IdeasSection) => {
    setSections((prev) => prev.map((s, i) => (i === index ? updatedSection : s)));
  };

  const handleDeleteSectionClick = (index: number) => {
    setSectionToDelete(index);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSection = () => {
    if (sectionToDelete !== null) {
      setSections((prev) => prev.filter((_, i) => i !== sectionToDelete));
      if (expandedSectionIndex === sectionToDelete) {
        setExpandedSectionIndex(null);
      }
      setSectionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSavePage = async () => {
    setTouched({ title: true, description: true });

    if (Object.values(errors).some(Boolean)) {
      setSnackbar({
        open: true,
        message: 'Preencha todos os campos obrigatórios e adicione pelo menos uma seção.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const payload: any = {
        ...(fromTemplatePage ? {} : ideasData?.id ? { id: ideasData.id } : {}),
        title: pageTitle,
        description: pageDescription,
        sections: sections.map((section, sectionIndex) => {
          const sectionPayload: any = {
            ...(fromTemplatePage ? {} : section.id ? { id: section.id } : {}),
            title: section.title,
            description: section.description,
            medias: section.medias.map((media, midiaIndex) => {
              const baseItem: any = {
                ...(fromTemplatePage ? {} : media.id ? { id: media.id } : {}),
                title: media.title,
                description: media.description,
                mediaType: media.mediaType,
                uploadType: media.uploadType,
                platformType: media.platformType,
                isLocalFile: media.uploadType === MediaUploadType.UPLOAD,
              };
              if (media.uploadType === MediaUploadType.UPLOAD && media.file) {
                const extension = media.file.name.split('.').pop() || 'bin';
                const fieldKey = `${media.mediaType}_${sectionIndex}_${midiaIndex}.${extension}`;
                formData.append(fieldKey, media.file, fieldKey);
                return { ...baseItem, fieldKey };
              }
              return { ...baseItem, url: media.url };
            }),
          };
          return sectionPayload;
        }),
      };

      formData.append('ideasMaterialsPageData', JSON.stringify(payload));

      const response = await (fromTemplatePage
        ? api.post('/ideas-pages', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        : api.patch(`/ideas-pages/${ideasData?.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }));

      if (!response?.data) throw new Error('Erro ao salvar');

      setSnackbar({
        open: true,
        message: 'Página salva com sucesso!',
        severity: 'success',
      });

      await dispatch(fetchRoutes());
      navigate(`/${response.data.route.path}`);
    } catch {
      setSnackbar({
        open: true,
        message: 'Erro ao salvar a página.',
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
        <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <IconButton
            onClick={() => navigate(-1)}
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
            {fromTemplatePage ? '💡 Nova Página de Ideias' : '✏️ Editar Página de Ideias'}
          </Typography>
        </Box>

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
            Informações Básicas
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Título da Página"
                fullWidth
                required
                value={pageTitle}
                onChange={(e) => {
                  setPageTitle(e.target.value);
                  if (touched.title) setTouched((prev) => ({ ...prev, title: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                error={touched.title && errors.title}
                helperText={touched.title && errors.title ? 'Campo obrigatório' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover:not(.Mui-error)': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: 1,
                    fontSize: '0.75rem',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição da Página"
                fullWidth
                required
                multiline
                rows={4}
                value={pageDescription}
                onChange={(e) => {
                  setPageDescription(e.target.value);
                  if (touched.description) setTouched((prev) => ({ ...prev, description: false }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                error={touched.description && errors.description}
                helperText={touched.description && errors.description ? 'Campo obrigatório' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover:not(.Mui-error)': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: 1,
                    fontSize: '0.75rem',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {sections.length > 0 && (
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
              📚 Seções ({sections.length})
            </Typography>
            {sections.map((section, index) => (
              <Accordion
                key={index}
                expanded={expandedSectionIndex === index}
                onChange={() => setExpandedSectionIndex(expandedSectionIndex === index ? null : index)}
                sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-expanded': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {section.title || `Seção ${index + 1}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <IdeasMaterialSection
                    section={section}
                    onUpdate={(updatedSection) => handleUpdateSection(index, updatedSection)}
                  />
                </AccordionDetails>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderTop: 1, borderColor: 'divider' }}>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteSectionClick(index)}
                    sx={{
                      '&:hover': {
                        bgcolor: 'error.lighter',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Accordion>
            ))}
          </Paper>
        )}

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSection}
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
                boxShadow: 3,
                bgcolor: 'action.hover',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Adicionar Seção
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSavePage}
            disabled={loading}
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
            {loading ? 'Salvando...' : 'Salvar Página'}
          </Button>
        </Box>
      </Container>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteSection}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
