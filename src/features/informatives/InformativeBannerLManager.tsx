import React, { useState } from 'react';
import { Box, CircularProgress, Alert, Typography, Stack, Container, Paper } from '@mui/material';
import { Campaign } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store/slices';
import { setInformativeBanner, InformativeBannerData } from 'store/slices/informative/informativeBannerSlice';
import { useInformativeBanners } from './hooks';
import { deleteBannerApi } from './api';

import BannerToolbar from './components/BannerToolbar';
import BannerSearch from './components/BannerSearch';
import BannerGrid from './components/BannerGrid';

import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import InformativeBannerModal from './components/InformativeBannerModal';
import BackHeader from '@/components/common/header/BackHeader';

export default function InformativeBannerLManager() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    filtered,
    searchTerm,
    setSearchTerm,
    isFiltering,
    loading,
    error,
    setError,
    fetchBanners,
  } = useInformativeBanners();

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<InformativeBannerData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InformativeBannerData | null>(null);

  const handleOpenCreate = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (banner: InformativeBannerData) => {
    dispatch(setInformativeBanner(banner));
    setEditData(banner);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBannerApi(deleteTarget.id || '');
      await fetchBanners();
    } catch {
      setError('Erro ao excluir o banner. Tente novamente.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📢 Banners Informativos" />
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
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <BannerSearch value={searchTerm} onChange={setSearchTerm} loading={isFiltering} />
              <BannerToolbar onCreate={handleOpenCreate} />
            </Stack>
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
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body2" mt={2} color="text.secondary">
              Carregando banners informativos...
            </Typography>
          </Box>
        ) : error ? (
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
                <Box
                  component="span"
                  sx={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  onClick={fetchBanners}
                >
                  Tentar novamente
                </Box>
              }
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
              <Campaign sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhum banner encontrado
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {searchTerm
                  ? 'Tente ajustar sua busca ou limpar os filtros.'
                  : 'Ainda não há banners informativos cadastrados.'}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <>
            {isFiltering && filtered.length > 0 && (
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
            <BannerGrid items={filtered} onEdit={handleOpenEdit} onDeleteAsk={setDeleteTarget} />
          </>
        )}

        <InformativeBannerModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={fetchBanners}
          initialData={editData}
        />

        <DeleteConfirmDialog
          open={!!deleteTarget}
          title={deleteTarget?.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </Container>
    </Box>
  );
}
