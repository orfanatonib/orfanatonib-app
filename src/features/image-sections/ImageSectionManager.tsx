import { useState } from 'react';
import { Box } from '@mui/material';
import { Collections } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '@/store/slices';
import { setData, SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { RejectImageSectionDialog } from './components/RejectImageSectionDialog';
import ImagePageCard from './components/ImagePageCard';
import ImagePageDetailsModal from './components/ImagePageDetailsModal';
import { deleteImageSection, fetchImageSectionsPage } from './api';
import {
  ADMIN_IMAGE_SECTION_EDIT_ROUTE,
  IMAGE_SECTIONS_DEFAULT_SORT,
  IMAGE_SECTIONS_MESSAGES,
  IMAGE_SECTIONS_TEST_ID_PREFIX,
  IMAGE_SECTION_FILTER_KEYS,
  IMAGE_SECTION_LABELS,
  IMAGE_SECTION_SORT_OPTIONS,
  IMAGE_SECTION_TEST_IDS,
  REVIEW_STATUS_LABELS,
} from './constants';
import { useRefreshImageSectionsPending } from './hooks';
import { ImageSectionReviewStatus } from './types';

const P = IMAGE_SECTIONS_TEST_ID_PREFIX;
const K = IMAGE_SECTION_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.REVIEW_STATUS,
    label: IMAGE_SECTION_LABELS.FILTER_STATUS,
    allLabel: IMAGE_SECTION_LABELS.FILTER_STATUS_ALL,
    options: Object.values(ImageSectionReviewStatus).map((value) => ({
      value,
      label: REVIEW_STATUS_LABELS[value],
    })),
  },
  { kind: 'date', key: K.CREATED_FROM, label: IMAGE_SECTION_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: IMAGE_SECTION_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: IMAGE_SECTION_LABELS.FILTER_SORT,
    allLabel: null,
    options: IMAGE_SECTION_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: IMAGE_SECTIONS_DEFAULT_SORT };

export default function ImageSectionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const refreshPending = useRefreshImageSectionsPending();

  const list = useAdminList<SectionData>({
    fetcher: fetchImageSectionsPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: IMAGE_SECTIONS_MESSAGES.LOAD_FAILED,
  });

  const [sectionToDelete, setSectionToDelete] = useState<SectionData | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [sectionToReject, setSectionToReject] = useState<SectionData | null>(null);
  const [actionError, setActionError] = useState('');

  const handleEdit = (section: SectionData) => {
    dispatch(setData(section));
    navigate(ADMIN_IMAGE_SECTION_EDIT_ROUTE);
  };

  const handleDelete = async () => {
    if (!sectionToDelete) return;
    const id = sectionToDelete.id;
    setSectionToDelete(null);
    setActionError('');
    try {
      await deleteImageSection(id || '');
      void refreshPending();
      list.reload();
    } catch (failure: unknown) {
      console.error('Falha ao apagar a publicação', failure);
      setActionError(IMAGE_SECTIONS_MESSAGES.DELETE_FAILED);
    }
  };

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={IMAGE_SECTIONS_MESSAGES.TITLE}
      searchLabel={IMAGE_SECTION_LABELS.SEARCH}
      searchPlaceholder={IMAGE_SECTION_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={IMAGE_SECTIONS_MESSAGES.EMPTY}
      emptyIcon={<Collections sx={{ fontSize: 64, color: 'text.secondary' }} />}
      skeletonWithCover
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
            testId={IMAGE_SECTION_TEST_IDS.DELETE_DIALOG}
            open={!!sectionToDelete}
            title={sectionToDelete?.caption || 'Seção'}
            onClose={() => setSectionToDelete(null)}
            onConfirm={handleDelete}
          />

          <RejectImageSectionDialog
            open={!!sectionToReject}
            sectionId={sectionToReject?.id ?? null}
            caption={sectionToReject?.caption ?? ''}
            onClose={() => setSectionToReject(null)}
            onRejected={() => {
              setSectionToReject(null);
              void refreshPending();
              list.reload();
            }}
          />

          <ImagePageDetailsModal
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
            <ImagePageCard
              section={section}
              onDelete={setSectionToDelete}
              onEdit={handleEdit}
              onViewDetails={setSelectedSection}
              onReject={setSectionToReject}
            />
          </Box>
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
