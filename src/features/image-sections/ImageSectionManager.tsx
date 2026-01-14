import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Container,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Typography,
} from '@mui/material';
import { Search, Clear, Collections } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '@/store/slices';
import { setData, SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { setIdeasSectionData } from '@/store/slices/ideas/ideasSlice';
import { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { MediaType, MediaUploadType, MediaPlatform } from '@/store/slices/types';
import ImagePageCard from './components/ImagePageCard';
import ImagePageDetailsModal from './components/ImagePageDetailsModal';
import { deleteImageSection } from './api';
import { useImageSections } from './hooks';
import BackHeader from '@/components/common/header/BackHeader';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { motion } from 'framer-motion';

export default function ImageSectionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    filteredSections, loading, isFiltering, error, setError,
    searchTerm, setSearchTerm, fetchSections,
  } = useImageSections();

  const [sectionToDelete, setSectionToDelete] = useState<SectionData | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const handleEdit = (section: SectionData) => {
    dispatch(setData(section));
    navigate('/adm/editar-imagens-shelter');
  };

  const handleDelete = async () => {
    if (!sectionToDelete) return;
    const id = sectionToDelete.id;
    setSectionToDelete(null);
    try {
      await deleteImageSection(id || '');
      await fetchSections();
    } catch {
      setError('Erro ao deletar seção de imagens');
    }
  };

  const isBusy = loading || isFiltering;
  const hasQuery = Boolean(searchTerm);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📸 Imagens dos Abrigos" />
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
            <TextField
              fullWidth
              placeholder="Buscar por legenda ou descrição..."
              label="Buscar galerias"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputProps={{ 'aria-label': 'Buscar seções de imagens' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {isFiltering && <CircularProgress size={20} sx={{ mr: hasQuery ? 1 : 0 }} />}
                    {hasQuery && (
                      <Tooltip title="Limpar busca">
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm('')}
                          sx={{
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <Clear fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
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
              }}
            />
          </Paper>
        </motion.div>

        {isBusy && filteredSections.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{
                borderRadius: 3,
                fontSize: '1rem',
              }}
            >
              {error}
            </Alert>
          </motion.div>
        ) : filteredSections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: 'background.paper',
              }}
            >
              <Collections sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhuma galeria encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {hasQuery
                  ? 'Tente ajustar sua busca ou limpar os filtros.'
                  : 'Ainda não há galerias de imagens dos abrigos cadastradas.'}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <>
            {(loading || isFiltering) && filteredSections.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 2,
                }}
              >
                <CircularProgress size={32} />
              </Box>
            )}
            <Grid container spacing={3} alignItems="stretch">
              {filteredSections.map((section, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={section.id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  sx={{ display: 'flex' }}
                >
                  <ImagePageCard
                    section={section}
                    onDelete={setSectionToDelete}
                    onEdit={handleEdit}
                    onViewDetails={setSelectedSection}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <DeleteConfirmDialog
          open={!!sectionToDelete}
          title={sectionToDelete?.caption || 'Seção'}
          onClose={() => setSectionToDelete(null)}
          onConfirm={handleDelete}
        />

        <ImagePageDetailsModal
          section={selectedSection}
          open={!!selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      </Container>
    </Box>
  );
}
