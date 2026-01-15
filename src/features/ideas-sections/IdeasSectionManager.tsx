import React, { useEffect, useState } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Paper,
} from '@mui/material';
import { Search, Clear, Edit, Delete, Add, Lightbulb } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import IdeasSectionCard from './components/IdeasSectionCard';
import IdeasSectionDetailsModal from './components/IdeasSectionDetailsModal';
import { deleteIdeasSection } from './api';
import { useIdeasSections } from './hooks';
import { IdeasSection as IdeasSectionType } from './types';
import { setIdeasSectionData } from '@/store/slices/ideas/ideasSlice';
import { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { MediaType, MediaUploadType, MediaPlatform } from '@/store/slices/types';
import BackHeader from '@/components/common/header/BackHeader';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

export default function IdeasSectionManager() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    filteredSections,
    loading,
    isFiltering,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    fetchSections,
  } = useIdeasSections();

  const [sectionToDelete, setSectionToDelete] = useState<IdeasSectionType | null>(null);
  const [selectedSection, setSelectedSection] = useState<IdeasSectionType | null>(null);

  useEffect(() => { 
    fetchSections();
  }, [fetchSections]);

  const handleEdit = (section: IdeasSectionType) => {
    const ideasSection: IdeasSection = {
      id: section.id,
      title: section.title,
      description: section.description,
      public: section.public,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      medias: (section.medias || []).map(media => ({
        id: media.id,
        title: media.title,
        description: media.description,
        uploadType: media.uploadType as MediaUploadType,
        mediaType: media.mediaType as MediaType,
        isLocalFile: media.isLocalFile,
        url: media.url,
        platformType: media.platformType as MediaPlatform || undefined,
        originalName: media.originalName || undefined,
        size: media.size || undefined,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
      })),
    };
    
    dispatch(setIdeasSectionData(ideasSection));
    
    navigate('/adm/editar-ideias-compartilhadas');
  };

  const handleDelete = async () => {
    if (!sectionToDelete || !sectionToDelete.id) return;
    const id = sectionToDelete.id;
    setSectionToDelete(null);
    try {
      await deleteIdeasSection(id);
      await fetchSections();
    } catch {
      setError('Erro ao deletar seção de ideias');
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
          <BackHeader title="💡 Ideias Compartilhadas" />
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
              placeholder="Buscar por título ou descrição..."
              label="Buscar seções"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputProps={{ 'aria-label': 'Buscar Ideias compartilhadas' }}
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
              <Lightbulb sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhuma seção encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {hasQuery
                  ? 'Tente ajustar sua busca ou limpar os filtros.'
                  : 'Ainda não há seções de ideias compartilhadas cadastradas.'}
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
                  <IdeasSectionCard
                    section={section}
                    onDelete={(section) => setSectionToDelete(section)}
                    onEdit={handleEdit}
                    onViewDetails={(section) => setSelectedSection(section)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <DeleteConfirmDialog
          open={!!sectionToDelete}
          title={sectionToDelete?.title || 'Seção'}
          onClose={() => setSectionToDelete(null)}
          onConfirm={handleDelete}
        />

        <IdeasSectionDetailsModal
          section={selectedSection}
          open={!!selectedSection}
          onClose={() => setSelectedSection(null)}
        />

      </Container>
    </Box>
  );
}
