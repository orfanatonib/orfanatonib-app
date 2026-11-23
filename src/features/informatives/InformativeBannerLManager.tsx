import { useState } from 'react';
import { Add, Campaign } from '@mui/icons-material';
import { Alert, Button, Snackbar } from '@mui/material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store/slices';
import { setInformativeBanner, InformativeBannerData } from 'store/slices/informative/informativeBannerSlice';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import InformativeBannerModal from './components/InformativeBannerModal';
import InformativeCard from './components/InformativeCard';
import { deleteBannerApi, fetchBannersPage } from './api';
import {
  INFORMATIVES_DEFAULT_SORT,
  INFORMATIVES_LABELS,
  INFORMATIVES_TEST_ID_PREFIX,
  INFORMATIVE_FILTER_KEYS,
  INFORMATIVE_SORT_OPTIONS,
  INFORMATIVE_VISIBILITY_OPTIONS,
} from './constants';

const P = INFORMATIVES_TEST_ID_PREFIX;
const K = INFORMATIVE_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.PUBLIC,
    label: INFORMATIVES_LABELS.FILTER_VISIBILITY,
    allLabel: INFORMATIVES_LABELS.FILTER_VISIBILITY_ALL,
    options: INFORMATIVE_VISIBILITY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  { kind: 'date', key: K.CREATED_FROM, label: INFORMATIVES_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: INFORMATIVES_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: INFORMATIVES_LABELS.FILTER_SORT,
    allLabel: null,
    options: INFORMATIVE_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: INFORMATIVES_DEFAULT_SORT };

export default function InformativeBannerLManager() {
  const dispatch = useDispatch<AppDispatch>();
  const list = useAdminList<InformativeBannerData>({
    fetcher: fetchBannersPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: INFORMATIVES_LABELS.LOAD_ERROR,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<InformativeBannerData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InformativeBannerData | null>(null);
  const [deleteError, setDeleteError] = useState('');

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
      list.reload();
    } catch {
      setDeleteError(INFORMATIVES_LABELS.DELETE_ERROR);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={INFORMATIVES_LABELS.TITLE}
      searchLabel={INFORMATIVES_LABELS.SEARCH}
      searchPlaceholder={INFORMATIVES_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={INFORMATIVES_LABELS.EMPTY}
      emptyIcon={<Campaign sx={{ fontSize: 64, color: 'text.secondary' }} />}
      primaryAction={
        <Button
          data-testid={`${P}-create`}
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          fullWidth
          sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {INFORMATIVES_LABELS.CREATE}
        </Button>
      }
      overlays={
        <>
          <InformativeBannerModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={async () => list.reload()}
            initialData={editData}
          />
          <DeleteConfirmDialog
            testId={`${P}-delete-dialog`}
            open={!!deleteTarget}
            title={deleteTarget?.title}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
          <Snackbar open={!!deleteError} autoHideDuration={5000} onClose={() => setDeleteError('')}>
            <Alert data-testid={`${P}-delete-error`} severity="error" variant="filled" onClose={() => setDeleteError('')}>
              {deleteError}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((banner) => (
          <InformativeCard key={banner.id} banner={banner} onEdit={handleOpenEdit} onDeleteAsk={setDeleteTarget} />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
