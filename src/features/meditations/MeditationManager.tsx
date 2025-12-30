import { useState } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';
import { motion } from 'framer-motion';

import type { MeditationData, DayItem } from '@/store/slices/meditation/meditationSlice';
import MeditationCard from './components/MeditationCard';
import DayDetailsDialog from './components/DayDetailsDialog';
import { formatPtBrDate, useMeditationsList } from './hooks';
import BackHeader from '@/components/common/header/BackHeader';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import ImagePageToolbar from '../image-pages/components/ImagePageToolbar';

export default function MeditationManager() {
  const {
    meditations,
    loading,
    filtering,
    error,
    setError,
    search,
    setSearch,
    removeMeditation,
  } = useMeditationsList();

  const [selectedDay, setSelectedDay] = useState<DayItem | null>(null);
  const [meditationToDelete, setMeditationToDelete] = useState<MeditationData | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isBusy = loading || filtering;

  const handleToggleExpand = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📖 Lista de Meditações" />
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
            <Box>
              <ImagePageToolbar search={search} onSearchChange={setSearch} loading={filtering} />
            </Box>
          </Paper>
        </motion.div>

        {isBusy && meditations.length === 0 ? (
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
              Carregando meditações...
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
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </motion.div>
        ) : meditations.length === 0 ? (
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
              <MenuBook sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhuma meditação encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {search
                  ? 'Tente ajustar sua busca ou limpar os filtros.'
                  : 'Ainda não há meditações cadastradas.'}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <Box sx={{ position: 'relative', minHeight: '400px' }}>
            {filtering && meditations.length > 0 && (
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
              {meditations.map((meditation, index) => {
                const isExpanded = expandedId === meditation.id;

                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={meditation.id}
                    sx={{ display: 'flex' }}
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <MeditationCard
                      meditation={meditation}
                      onDelete={setMeditationToDelete}
                      onDayClick={setSelectedDay}
                      formatDate={formatPtBrDate}
                      isExpanded={isExpanded}
                      onToggleExpand={() => handleToggleExpand(meditation.id)}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        <DayDetailsDialog day={selectedDay} onClose={() => setSelectedDay(null)} />

        <DeleteConfirmDialog
          open={!!meditationToDelete}
          title={meditationToDelete?.topic || 'Meditação'}
          onClose={() => setMeditationToDelete(null)}
          onConfirm={async () => {
            if (!meditationToDelete) return;
            await removeMeditation(meditationToDelete);
            setMeditationToDelete(null);
          }}
        />
      </Container>
    </Box>
  );
}
