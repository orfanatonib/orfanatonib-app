import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import { Add, MenuBook } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import MediaDocumentPreviewModal from 'utils/MediaDocumentPreviewModal';
import { getMediaPreviewUrl } from 'utils/getMediaPreviewUrl';
import {
  type DayItem,
  type MeditationData,
  setMeditationData,
} from '@/store/slices/meditation/meditationSlice';
import type { AppDispatch } from '@/store/slices';
import MeditationCard from './components/MeditationCard';
import MeditationDaysDialog from './components/MeditationDaysDialog';
import DayDetailsDialog from './components/DayDetailsDialog';
import { deleteMeditation, fetchMeditationsPage } from './api';
import {
  MEDITATIONS_DEFAULT_SORT,
  MEDITATIONS_LABELS,
  MEDITATIONS_TEST_ID_PREFIX,
  MEDITATION_CREATE_PATH,
  MEDITATION_EDIT_PATH,
  MEDITATION_FILTER_KEYS,
  MEDITATION_PERIOD_FILTER_LABELS,
  MEDITATION_SORT_OPTIONS,
} from './constants';
import { MeditationPeriod } from './types';

const P = MEDITATIONS_TEST_ID_PREFIX;
const K = MEDITATION_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.PERIOD,
    label: MEDITATIONS_LABELS.FILTER_PERIOD,
    allLabel: 'Todos os períodos',
    options: Object.values(MeditationPeriod).map((value) => ({ value, label: MEDITATION_PERIOD_FILTER_LABELS[value] })),
  },
  { kind: 'date', key: K.START_FROM, label: MEDITATIONS_LABELS.FILTER_START_FROM },
  { kind: 'date', key: K.START_TO, label: MEDITATIONS_LABELS.FILTER_START_TO },
  { kind: 'date', key: K.CREATED_FROM, label: MEDITATIONS_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: MEDITATIONS_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: MEDITATIONS_LABELS.FILTER_SORT,
    allLabel: null,
    options: MEDITATION_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: MEDITATIONS_DEFAULT_SORT };

export default function MeditationManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const list = useAdminList<MeditationData>({
    fetcher: fetchMeditationsPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: MEDITATIONS_LABELS.LOAD_ERROR,
  });

  const [daysOf, setDaysOf] = useState<MeditationData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayItem | null>(null);
  const [materialOf, setMaterialOf] = useState<MeditationData | null>(null);
  const [toDelete, setToDelete] = useState<MeditationData | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleEdit = useCallback(
    (meditation: MeditationData) => {
      dispatch(setMeditationData(meditation));
      navigate(MEDITATION_EDIT_PATH);
    },
    [dispatch, navigate],
  );

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMeditation(toDelete.id);
      list.reload();
    } catch {
      setDeleteError(MEDITATIONS_LABELS.DELETE_ERROR);
    } finally {
      setToDelete(null);
    }
  };

  const materialMedia = useMemo(
    () => (materialOf ? { ...materialOf.media, url: getMediaPreviewUrl(materialOf.media) } : null),
    [materialOf],
  );

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={MEDITATIONS_LABELS.TITLE}
      searchLabel={MEDITATIONS_LABELS.SEARCH}
      searchPlaceholder={MEDITATIONS_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={MEDITATIONS_LABELS.EMPTY}
      emptyIcon={<MenuBook sx={{ fontSize: 64, color: 'text.secondary' }} />}
      primaryAction={
        <Button
          data-testid={`${P}-create`}
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate(MEDITATION_CREATE_PATH)}
          fullWidth
          sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {MEDITATIONS_LABELS.CREATE}
        </Button>
      }
      overlays={
        <>
          <MeditationDaysDialog meditation={daysOf} onClose={() => setDaysOf(null)} onDayClick={setSelectedDay} />
          <DayDetailsDialog day={selectedDay} onClose={() => setSelectedDay(null)} />
          <MediaDocumentPreviewModal
            open={!!materialOf}
            onClose={() => setMaterialOf(null)}
            media={materialMedia as MeditationData['media'] | null}
          />
          <DeleteConfirmDialog
            testId={`${P}-delete-dialog`}
            open={!!toDelete}
            title={toDelete?.topic || MEDITATIONS_LABELS.DELETE_TITLE_FALLBACK}
            onClose={() => setToDelete(null)}
            onConfirm={handleConfirmDelete}
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
        {list.items.map((meditation) => (
          <MeditationCard
            key={meditation.id}
            meditation={meditation}
            onDelete={setToDelete}
            onShowDays={setDaysOf}
            onShowMaterial={setMaterialOf}
            onEdit={handleEdit}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
