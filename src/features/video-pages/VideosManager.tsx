import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
  Alert as MuiAlert,
  useMediaQuery,
  useTheme,
  Container,
  Typography,
} from '@mui/material';
import { VideoLibrary } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppDispatch } from '@/store/slices';
import { setVideoData, VideoPageData } from 'store/slices/video/videoSlice';

import { useVideoPages } from './hooks';
import VideoPageToolbar from './components/VideoPageToolbar';
import VideoPageCard from './components/VideoPageCard';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import VideoPageDetailsModal from './components/VideoPageDetailsModal';
import BackHeader from '@/components/common/header/BackHeader';

export default function VideosManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    pages,
    filtered,
    loading,
    error,
    search,
    setSearch,
    fetchPages,
    removePage,
    setError,
  } = useVideoPages();

  const [selectedPage, setSelectedPage] = useState<VideoPageData | null>(null);
  const [pageToDelete, setPageToDelete] = useState<VideoPageData | null>(null);
  const [snackbar, setSnackbar] = useState<{open:boolean; message:string; severity:'success'|'error'}>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleEdit = (page: VideoPageData) => {
    dispatch(setVideoData(page));
    navigate('/adm/editar-pagina-videos');
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;
    try {
      await removePage(pageToDelete.id || '');
      setSnackbar({ open: true, message: 'Página excluída com sucesso.', severity: 'success' });
    } catch {
      setError('Erro ao deletar página');
      setSnackbar({ open: true, message: 'Erro ao excluir página.', severity: 'error' });
    } finally {
      setPageToDelete(null);
    }
  };

  const isFiltering = pages.length > 0 && pages.length !== filtered.length;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="🎥 Páginas de Vídeos" />
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
            <VideoPageToolbar
              search={search}
              onSearch={setSearch}
              onRefresh={fetchPages}
              isFiltering={isFiltering}
            />
          </Paper>
        </motion.div>

        {/* Content Section */}
        {loading && filtered.length === 0 ? (
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
              <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhuma página encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isFiltering
                  ? 'Nenhuma página corresponde ao filtro aplicado.'
                  : search
                    ? 'Tente ajustar sua busca ou limpar os filtros.'
                    : 'Ainda não há páginas de vídeos cadastradas.'}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <>
            {loading && filtered.length > 0 && (
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
                  key={page.id}
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  sx={{ display: 'flex' }}
                >
                  <VideoPageCard
                    page={page}
                    onView={() => setSelectedPage(page)}
                    onEdit={() => handleEdit(page)}
                    onDelete={() => setPageToDelete(page)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <DeleteConfirmDialog
          open={!!pageToDelete}
          title={pageToDelete?.title}
          onClose={() => setPageToDelete(null)}
          onConfirm={handleDelete}
        />

        <VideoPageDetailsModal
          page={selectedPage}
          open={!!selectedPage}
          onClose={() => setSelectedPage(null)}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{
              borderRadius: 2,
            }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Container>
    </Box>
  );
}
