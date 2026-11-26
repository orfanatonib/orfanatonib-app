import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import IdeasSectionCard from './components/IdeasSectionCard';
import IdeasSectionDetailsModal from './components/IdeasSectionDetailsModal';
import { deleteIdeasSection, fetchIdeasSectionsPage } from './api';
import { ideasSectionErrorMessage } from './errors';
import {
  IDEAS_SECTIONS_DEFAULT_SORT,
  IDEAS_SECTIONS_TEST_ID_PREFIX,
  IDEAS_SECTION_FILTER_KEYS,
  IDEAS_SECTION_LABELS,
  IDEAS_SECTION_MEDIA_FILTER_TYPES,
  IDEAS_SECTION_SORT_OPTIONS,
  IDEAS_SECTION_MESSAGES,
  MEDIA_TYPE_LABELS,
} from './constants';
import { useRefreshPendingCounts } from '@/features/admin-pending-counts';
import { IdeasSection as IdeasSectionType } from './types';
import { buildEditSectionPath } from './utils';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

const P = IDEAS_SECTIONS_TEST_ID_PREFIX;
const K = IDEAS_SECTION_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.MEDIA_TYPE,
    label: IDEAS_SECTION_LABELS.FILTER_MEDIA_TYPE,
    allLabel: IDEAS_SECTION_LABELS.FILTER_MEDIA_TYPE_ALL,
    options: IDEAS_SECTION_MEDIA_FILTER_TYPES.map((value) => ({ value, label: MEDIA_TYPE_LABELS[value] })),
  },
  { kind: 'date', key: K.CREATED_FROM, label: IDEAS_SECTION_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: IDEAS_SECTION_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: IDEAS_SECTION_LABELS.FILTER_SORT,
    allLabel: null,
    options: IDEAS_SECTION_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: IDEAS_SECTIONS_DEFAULT_SORT };

export default function IdeasSectionManager() {
  const navigate = useNavigate();
  const refreshPending = useRefreshPendingCounts();

  const list = useAdminList<IdeasSectionType>({
    fetcher: fetchIdeasSectionsPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: IDEAS_SECTION_MESSAGES.LOAD_FAILED,
  });

  const [sectionToDelete, setSectionToDelete] = useState<IdeasSectionType | null>(null);
  const [selectedSection, setSelectedSection] = useState<IdeasSectionType | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const handleEdit = (section: IdeasSectionType) => {
    navigate(buildEditSectionPath(section.id));
  };

  const handleDelete = async () => {
    if (!sectionToDelete || !sectionToDelete.id) return;
    const id = sectionToDelete.id;
    setSectionToDelete(null);
    setActionError('');
    try {
      await deleteIdeasSection(id);
      list.reload();
      void refreshPending();
    } catch (error: unknown) {
      setActionError(ideasSectionErrorMessage(error, IDEAS_SECTION_MESSAGES.DELETE_FAILED));
    }
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={IDEAS_SECTION_MESSAGES.MANAGER_TITLE}
      searchLabel={IDEAS_SECTION_LABELS.SEARCH}
      searchPlaceholder={IDEAS_SECTION_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={IDEAS_SECTION_MESSAGES.EMPTY}
      emptyIcon={<Lightbulb sx={{ fontSize: 64, color: 'text.secondary' }} />}
      beforeToolbar={
        actionError ? (
          <Box
            role="alert"
            data-testid={`${P}-action-error`}
            onClick={() => setActionError('')}
            sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'error.light', color: 'error.contrastText', cursor: 'pointer' }}
          >
            {actionError}
          </Box>
        ) : null
      }
      overlays={
        <>
          <DeleteConfirmDialog
            testId={`${P}-delete-dialog`}
            open={!!sectionToDelete}
            title={sectionToDelete?.title || 'Seção'}
            onClose={() => setSectionToDelete(null)}
            onConfirm={handleDelete}
          />
          <IdeasSectionDetailsModal
            section={selectedSection}
            open={!!selectedSection}
            onClose={() => setSelectedSection(null)}
          />
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((section) => (
          <Box key={section.id} data-testid={`${P}-card-${section.id}`} sx={{ display: 'flex', width: '100%', minWidth: 0 }}>
            <IdeasSectionCard
              section={section}
              onDelete={setSectionToDelete}
              onEdit={handleEdit}
              onViewDetails={setSelectedSection}
            />
          </Box>
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
