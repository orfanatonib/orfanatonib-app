import { useState } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  InputAdornment,
  Paper,
  Container,
  Typography,
} from '@mui/material';
import { Search as SearchIcon, FilterList } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { AppDispatch } from '@/store/slices';
import { setVisitMaterialData, VisitMaterialPageData } from 'store/slices/visit-material/visitMaterialSlice';
import { fetchRoutes } from '@/store/slices/route/routeSlice';

import { useVisitMaterials } from './hooks';
import VisitMaterialDetailsModal from './components/VisitMaterialDetailsModal';
import SetCurrentMaterialConfirmDialog from './components/SetCurrentMaterialConfirmDialog';
import VisitMaterialCard from './components/VisitMaterialCard';
import BackHeader from '@/components/common/header/BackHeader';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

export default function VisitMaterialManager() {
  const { materials, search, setSearch, testament, setTestament, loading, isFiltering, error, setError, fetchAll, remove, markAsCurrent } =
    useVisitMaterials();

  const [materialToDelete, setMaterialToDelete] = useState<VisitMaterialPageData | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<VisitMaterialPageData | null>(null);
  const [materialToSetAsCurrent, setMaterialToSetAsCurrent] = useState<VisitMaterialPageData | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'ALL' | 'OLD_TESTAMENT' | 'NEW_TESTAMENT') => {
    if (newValue === 'ALL') {
      setTestament(undefined);
    } else {
      setTestament(newValue);
    }
  };

  const activeTab = testament || 'ALL';

  const handleEdit = (material: VisitMaterialPageData) => {
    dispatch(setVisitMaterialData(material));
    navigate('/adm/editar-pagina-visita');
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;
    await remove(materialToDelete.id);
    setMaterialToDelete(null);
  };

  const handleSetAsCurrentMaterial = async () => {
    if (!materialToSetAsCurrent) return;
    await markAsCurrent(materialToSetAsCurrent.id);
    setMaterialToSetAsCurrent(null);
    await dispatch(fetchRoutes());
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 6,
      }}
    >
      <BackHeader title="Materiais de Visita" />

      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Buscar materiais por título, subtítulo ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'background.paper',
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
            </Box>

            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <FilterList sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Filtrar por Testamento:
                </Typography>
              </Box>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant={isXs ? 'scrollable' : 'standard'}
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  },
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: { xs: 48, md: 56 },
                    px: { xs: 1.5, sm: 2, md: 3 },
                    '&.Mui-selected': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <Tab label={isXs ? "📚 Todos" : "📚 Todos"} value="ALL" />
                <Tab label={isXs ? "📖 AT" : "📖 Antigo Testamento"} value="OLD_TESTAMENT" />
                <Tab label={isXs ? "✝️ NT" : "✝️ Novo Testamento"} value="NEW_TESTAMENT" />
              </Tabs>
            </Box>
          </Paper>
        </motion.div>

        {loading && materials.length === 0 ? (
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
          <Box sx={{ mt: 4 }}>
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
          </Box>
        ) : materials.length === 0 ? (
          <Paper
            elevation={1}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h5" color="text.secondary" gutterBottom>
              📭 Nenhum material encontrado
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {search
                ? 'Tente ajustar sua busca ou limpar os filtros.'
                : activeTab !== 'ALL'
                ? `Nenhum material do ${activeTab === 'OLD_TESTAMENT' ? 'Antigo' : 'Novo'} Testamento encontrado.`
                : 'Ainda não há materiais cadastrados.'}
            </Typography>
          </Paper>
        ) : (
          <>
            {(loading || isFiltering) && materials.length > 0 && (
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
            <Grid container spacing={3}>
              {materials.map((material, index) => (
                <Grid
                  item
                  key={material.id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                >
                  <VisitMaterialCard
                    material={material}
                    onView={() => setSelectedMaterial(material)}
                    onEdit={() => handleEdit(material)}
                    onDelete={() => setMaterialToDelete(material)}
                    onSetAsCurrent={() => setMaterialToSetAsCurrent(material)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      <DeleteConfirmDialog
        open={!!materialToDelete}
        title={materialToDelete?.title}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={handleDelete}
      />

      <VisitMaterialDetailsModal
        material={selectedMaterial}
        open={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />

      <SetCurrentMaterialConfirmDialog
        open={!!materialToSetAsCurrent}
        materialTitle={materialToSetAsCurrent?.title || ''}
        onClose={() => setMaterialToSetAsCurrent(null)}
        onConfirm={handleSetAsCurrentMaterial}
      />
    </Box>
  );
}
