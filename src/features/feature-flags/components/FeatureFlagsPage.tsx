import { useCallback, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid2,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useDispatch } from 'react-redux';

import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import type { AppDispatch } from '@/store/slices';
import { fetchFeatureFlags } from '@/store/slices/feature-flags/featureFlagsSlice';

import {
  FEATURE_FLAGS_PAGE_SIZE_OPTIONS,
  FEATURE_FLAG_AUDIENCE_FILTER_OPTIONS,
  FEATURE_FLAG_SORT_OPTIONS,
  FEATURE_FLAG_STATUS_OPTIONS,
} from '../constants';
import {
  useFeatureFlagMutations,
  useFeatureFlagsManagement,
} from '../hooks/useFeatureFlagsManagement';
import type { FeatureFlagFormValues, FeatureFlagResponse } from '../types';
import { parseFeatureFlagSort } from '../utils/featureFlagUtils';
import { FeatureFlagCard } from './FeatureFlagCard';
import { FeatureFlagFormDialog } from './FeatureFlagFormDialog';

export function FeatureFlagsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items,
    total,
    stats,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    filters,
    setFilters,
    loading,
    error,
    setError,
    refresh,
  } = useFeatureFlagsManagement();

  const refreshAll = useCallback(() => {
    refresh();
    void dispatch(fetchFeatureFlags());
  }, [dispatch, refresh]);

  const {
    saving,
    actionError,
    setActionError,
    actionMessage,
    setActionMessage,
    save,
    toggle,
    remove,
    syncCatalog,
  } = useFeatureFlagMutations(refreshAll);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeatureFlagResponse | null>(null);
  const [toDelete, setToDelete] = useState<FeatureFlagResponse | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (flag: FeatureFlagResponse) => {
    setEditing(flag);
    setFormOpen(true);
  };

  const handleSubmit = (values: FeatureFlagFormValues) =>
    save(values, editing?.key);

  const handleDelete = async () => {
    if (!toDelete) return;
    if (await remove(toDelete.key)) setToDelete(null);
  };

  const handleCopy = (flag: FeatureFlagResponse) => {
    void navigator.clipboard
      .writeText(flag.key)
      .then(() => setActionMessage(`Chave "${flag.key}" copiada.`))
      .catch(() => setActionError('Não foi possível copiar a chave.'));
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box
      data-testid="feature-flags-page"
      sx={{ width: { xs: '98%', md: '95%' }, py: { xs: 2, sm: 3 }, mx: 'auto' }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={800}>
            Feature flags
          </Typography>
          <Typography color="text.secondary">
            Ligue recursos e escolha quais perfis podem visualizá-los.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            type="button"
            variant="outlined"
            startIcon={<AutoFixHighIcon />}
            onClick={() => void syncCatalog()}
            disabled={saving}
            data-testid="feature-flags-sync-catalog"
            sx={{ minHeight: 44 }}
          >
            Conferir catálogo
          </Button>
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            data-testid="feature-flags-create"
            sx={{ minHeight: 44 }}
          >
            Nova flag
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip label={`${stats.total} no total`} />
        <Chip color="success" label={`${stats.enabled} ligadas`} />
        <Chip label={`${stats.disabled} desligadas`} />
        <Chip
          variant="outlined"
          label={`${stats.byAudience.EVERYONE} para todos`}
        />
        <Chip
          variant="outlined"
          label={`${stats.byAudience.ADMIN} só admin`}
        />
      </Stack>

      <Grid2 container spacing={2} sx={{ mb: 3 }}>
        <Grid2 size={{ xs: 12, md: 5 }}>
          <TextField
            fullWidth
            label="Buscar"
            placeholder="Chave, nome ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            inputProps={{ 'data-testid': 'feature-flags-search' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="feature-flags-status-label">Situação</InputLabel>
            <Select
              labelId="feature-flags-status-label"
              label="Situação"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              data-testid="feature-flags-status-filter"
            >
              {FEATURE_FLAG_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="feature-flags-audience-label">Público</InputLabel>
            <Select
              labelId="feature-flags-audience-label"
              label="Público"
              value={filters.audience}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  audience: event.target.value,
                }))
              }
              data-testid="feature-flags-audience-filter"
            >
              {FEATURE_FLAG_AUDIENCE_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 8, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="feature-flags-sort-label">Ordenação</InputLabel>
            <Select
              labelId="feature-flags-sort-label"
              label="Ordenação"
              value={`${filters.sort}:${filters.order}`}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  ...parseFeatureFlagSort(event.target.value),
                }))
              }
              data-testid="feature-flags-sort"
            >
              {FEATURE_FLAG_SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4, md: 1 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={refreshAll}
            disabled={loading}
            aria-label="Atualizar lista"
            data-testid="feature-flags-refresh"
            sx={{ minHeight: 56, width: '100%' }}
          >
            {loading ? <CircularProgress size={22} /> : <RefreshIcon />}
          </Button>
        </Grid2>
      </Grid2>

      {error || actionError ? (
        <Alert
          severity="error"
          onClose={() => {
            setError('');
            setActionError('');
          }}
          data-testid="feature-flags-error"
          sx={{ mb: 2 }}
        >
          {error || actionError}
        </Alert>
      ) : null}

      {loading && items.length === 0 ? (
        <Box
          data-testid="feature-flags-loading"
          sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}
        >
          <CircularProgress aria-label="Carregando feature flags" />
        </Box>
      ) : null}

      {!loading && items.length === 0 ? (
        <Box
          data-testid="feature-flags-empty"
          sx={{ py: 8, textAlign: 'center' }}
        >
          <Typography variant="h6">Nenhuma feature flag encontrada</Typography>
          <Typography color="text.secondary">
            Ajuste os filtros ou confira o catálogo de fábrica.
          </Typography>
        </Box>
      ) : null}

      {items.length > 0 ? (
        <Grid2 container spacing={2} data-testid="feature-flags-list">
          {items.map((flag) => (
            <Grid2 key={flag.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <FeatureFlagCard
                flag={flag}
                disabled={saving}
                onToggle={(target) => void toggle(target.key)}
                onEdit={openEdit}
                onCopy={handleCopy}
                onDelete={setToDelete}
              />
            </Grid2>
          ))}
        </Grid2>
      ) : null}

      {total > pageSize ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ mt: 3 }}
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="feature-flags-page-size-label">Por página</InputLabel>
            <Select
              labelId="feature-flags-page-size-label"
              label="Por página"
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
              data-testid="feature-flags-page-size"
            >
              {FEATURE_FLAGS_PAGE_SIZE_OPTIONS.map((size) => (
                <MenuItem key={size} value={String(size)}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, nextPage) => setPage(nextPage)}
            color="primary"
            data-testid="feature-flags-pagination"
          />
        </Stack>
      ) : null}

      <FeatureFlagFormDialog
        open={formOpen}
        flag={editing}
        saving={saving}
        error={actionError}
        onDismissError={() => setActionError('')}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={Boolean(toDelete)}
        title={toDelete?.name}
        loading={saving}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        testId="feature-flags-delete-dialog"
      />

      <Snackbar
        open={Boolean(actionMessage)}
        autoHideDuration={4000}
        onClose={() => setActionMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setActionMessage('')}
          data-testid="feature-flags-success"
        >
          {actionMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FeatureFlagsPage;
