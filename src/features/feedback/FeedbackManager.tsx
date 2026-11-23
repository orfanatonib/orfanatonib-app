import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { RateReview } from '@mui/icons-material';
import { useRefreshPendingCounts } from '@/features/admin-pending-counts';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { FeedbackData } from '@/store/slices/feedback/feedbackSlice';
import FeedbackCard from './components/FeedbackCard';
import FeedbackDetailsModal from './components/FeedbackDetailsModal';
import { fetchFeedbacksPage } from './api';
import {
  FEEDBACKS_DEFAULT_SORT,
  FEEDBACKS_LABELS,
  FEEDBACKS_TEST_ID_PREFIX,
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_FILTER_KEYS,
  FEEDBACK_RATING_OPTIONS,
  FEEDBACK_SORT_OPTIONS,
} from './constants';
import { useFeedbackMutations } from './hooks';
import { FeedbackReadFilter } from './types';
import type { SnackbarKind } from './types';

const P = FEEDBACKS_TEST_ID_PREFIX;
const K = FEEDBACK_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.READ,
    label: FEEDBACKS_LABELS.FILTER_STATUS,
    allLabel: FEEDBACKS_LABELS.FILTER_STATUS_ALL,
    options: [
      { value: FeedbackReadFilter.UNREAD, label: FEEDBACKS_LABELS.UNREAD },
      { value: FeedbackReadFilter.READ, label: FEEDBACKS_LABELS.READ },
    ],
  },
  {
    kind: 'select',
    key: K.CATEGORY,
    label: FEEDBACKS_LABELS.FILTER_CATEGORY,
    allLabel: FEEDBACKS_LABELS.FILTER_CATEGORY_ALL,
    options: FEEDBACK_CATEGORY_OPTIONS,
  },
  {
    kind: 'select',
    key: K.RATING,
    label: FEEDBACKS_LABELS.FILTER_RATING,
    allLabel: FEEDBACKS_LABELS.FILTER_RATING_ALL,
    options: FEEDBACK_RATING_OPTIONS,
  },
  { kind: 'date', key: K.CREATED_FROM, label: FEEDBACKS_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: FEEDBACKS_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: FEEDBACKS_LABELS.FILTER_SORT,
    allLabel: null,
    options: FEEDBACK_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: FEEDBACKS_DEFAULT_SORT };

const FeedbackManager: React.FC = () => {
  const list = useAdminList<FeedbackData>({
    fetcher: fetchFeedbacksPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: FEEDBACKS_LABELS.LOAD_ERROR,
  });
  const refreshPending = useRefreshPendingCounts();
  const { reload } = list;

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const refreshAll = useCallback(() => {
    reload();
    void refreshPending();
  }, [reload, refreshPending]);
  const { deleteOne, markAsRead } = useFeedbackMutations(refreshAll);

  const [selected, setSelected] = useState<FeedbackData | null>(null);
  const [toDelete, setToDelete] = useState<FeedbackData | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: SnackbarKind }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: SnackbarKind) =>
    setSnackbar({ open: true, message, severity });

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteOne(toDelete.id ?? '');
      showSnackbar(FEEDBACKS_LABELS.DELETED_OK, 'success');
    } catch {
      showSnackbar(FEEDBACKS_LABELS.DELETE_ERROR, 'error');
    } finally {
      setToDelete(null);
    }
  };

  const handleMarkAsRead = async (feedback: FeedbackData) => {
    try {
      await markAsRead(feedback.id ?? '');
      showSnackbar(FEEDBACKS_LABELS.MARKED_OK, 'success');
    } catch {
      showSnackbar(FEEDBACKS_LABELS.MARK_ERROR, 'error');
    }
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={FEEDBACKS_LABELS.TITLE}
      searchLabel={FEEDBACKS_LABELS.SEARCH}
      searchPlaceholder={FEEDBACKS_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={FEEDBACKS_LABELS.EMPTY}
      emptyIcon={<RateReview sx={{ fontSize: 64, color: 'text.secondary' }} />}
      overlays={
        <>
          <FeedbackDetailsModal
            feedback={selected}
            onClose={() => setSelected(null)}
            onMarkAsRead={() => selected && handleMarkAsRead(selected)}
            onDelete={() => {
              if (selected) setToDelete(selected);
              setSelected(null);
            }}
          />

          <DeleteConfirmDialog
            testId={`${P}-delete-dialog`}
            open={!!toDelete}
            title={toDelete?.name ?? 'este usuário'}
            onClose={() => setToDelete(null)}
            onConfirm={handleDelete}
          />

          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              data-testid={`${P}-snackbar`}
              severity={snackbar.severity}
              variant="filled"
              sx={{ borderRadius: 2 }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((feedback) => (
          <FeedbackCard
            key={feedback.id}
            feedback={feedback}
            onView={setSelected}
            onMarkRead={handleMarkAsRead}
            onDelete={setToDelete}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
};

export default FeedbackManager;
