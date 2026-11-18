import React from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Container,
  Paper,
} from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { motion } from 'framer-motion';

import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import IdeasPageCard from './components/IdeasPageCard';
import IdeasPageDetailsModal from './components/IdeasPageDetailsModal';
import IdeasToolbar from './components/IdeasToolbar';
import { useIdeasMutations, useIdeasPages, useIdeasSearch } from './hooks';
import BackHeader from '@/components/common/header/BackHeader';

export default function IdeasManager() {
  const { pages, loading, error, setError, fetchPages } = useIdeasPages();
  const { filtered, searchTerm, setSearchTerm, isFiltering } = useIdeasSearch(pages);
  const { mutError, setMutError, deletePage } = useIdeasMutations(fetchPages);

  const [pageToDelete, setPageToDelete] = React.useState<IdeasPageData | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<IdeasPageData | null>(null);
  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;
    try {
      await deletePage(pageToDelete.id || '');
      setError(null);
      setMutError(null);
    } catch {
    } finally {
      setPageToDelete(null);
    }
  };

  const anyError = error || mutError;

  return (
    <Box data-testid="ideas-pages-manager" sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="💡 Páginas de Ideias" />
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
            <IdeasToolbar
              search={searchTerm}
              onSearch={setSearchTerm}
              onRefresh={fetchPages}
              isFiltering={isFiltering}
            />
          </Paper>
        </motion.div>

        {loading && filtered.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <CircularProgress size={60} thickness={4} aria-label="Carregando páginas" />
            <Typography variant="body2" mt={2} color="text.secondary">
              Carregando páginas de ideias...
            </Typography>
          </Box>
        ) : anyError ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              severity="error"
              sx={{
                borderRadius: 3,
                fontSize: '1rem',
              }}
              action={
                <Button onClick={fetchPages} color="inherit" size="small">
                  Tentar novamente
                </Button>
              }
            >
              {anyError}
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
              <Lightbulb sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhuma página encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {searchTerm
                  ? 'Tente ajustar sua busca ou limpar os filtros.'
                  : 'Ainda não há páginas de ideias cadastradas.'}
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
                  <IdeasPageCard
                    page={page}
                    onView={() => setSelectedPage(page)}
                    onDelete={() => setPageToDelete(page)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <IdeasPageDetailsModal
          page={selectedPage}
          open={!!selectedPage}
          onClose={() => setSelectedPage(null)}
        />

        <DeleteConfirmDialog
          open={!!pageToDelete}
          title={pageToDelete?.title}
          onClose={() => setPageToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      </Container>
    </Box>
  );
}
