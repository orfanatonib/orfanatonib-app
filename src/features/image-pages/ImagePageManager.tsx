import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import { AppDispatch } from '@/store/slices';
import { setImageData, ImagePageData } from 'store/slices/image/imageSlice';
import { motion } from 'framer-motion';

import { useImagePages } from './hooks';
import ImagePageToolbar from './components/ImagePageToolbar';
import ImagePageCard from './components/ImagePageCard';
import ImagePageDetailsModal from './components/ImagePageDetailsModal';
import BackHeader from '@/components/common/header/BackHeader';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

export default function ImagePageManager() {
  const {
    filtered,
    loading,
    isFiltering,
    error,
    search,
    setSearch,
    setError,
    fetchPages,
    removePage,
  } = useImagePages();

  const [pageToDelete, setPageToDelete] = React.useState<ImagePageData | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<ImagePageData | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleEdit = React.useCallback(
    (page: ImagePageData) => {
      dispatch(setImageData(page));
      navigate('/adm/editar-pagina-imagens');
    },
    [dispatch, navigate]
  );

  const handleConfirmDelete = React.useCallback(async () => {
    if (!pageToDelete) return;
    const id = pageToDelete.id;
    setPageToDelete(null);
    try {
      await removePage(id || '');
    } catch (err) {
      console.error('Erro ao deletar página de imagens:', err);
      setError('Erro ao deletar página de imagens');
      await fetchPages();
    }
  }, [pageToDelete, removePage, setError, fetchPages]);

  const isBusy = loading || isFiltering;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📸 Páginas de Imagens" />
        </motion.div>

        {/* Search Section */}
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
            <ImagePageToolbar search={search} onSearchChange={setSearch} loading={isFiltering} />
          </Paper>
        </motion.div>

        {/* Content Section */}
        {isBusy && filtered.length === 0 ? (
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
        ) : filtered.length === 0 ? (
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
              <PhotoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhuma página encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {search
                  ? 'Tente ajustar sua busca ou limpar os filtros.'
                  : 'Ainda não há páginas de imagens cadastradas.'}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <>
            {(loading || isFiltering) && filtered.length > 0 && (
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
              {filtered.map((page, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={page.id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  sx={{ display: 'flex' }}
                >
                  <ImagePageCard
                    page={page}
                    onDelete={setPageToDelete}
                    onEdit={handleEdit}
                    onViewDetails={setSelectedPage}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <DeleteConfirmDialog
          open={!!pageToDelete}
          title={pageToDelete?.title || pageToDelete?.title || 'Página de imagens'}
          onClose={() => setPageToDelete(null)}
          onConfirm={handleConfirmDelete}
        />

        <ImagePageDetailsModal
          page={selectedPage}
          open={!!selectedPage}
          onClose={() => setSelectedPage(null)}
        />
      </Container>
    </Box>
  );
}
