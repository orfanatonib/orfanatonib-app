import { useEffect, useState } from 'react';
import { Collections } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '@/store/slices';
import { setData, SectionData } from '@/store/slices/image-section/imageSectionSlice';
import AdminPageShell from '@/components/common/admin-shell/AdminPageShell';
import AdminSearchBar from '@/components/common/admin-shell/AdminSearchBar';
import AdminListSkeleton from '@/components/common/admin-shell/AdminListSkeleton';
import AdminEmptyState from '@/components/common/admin-shell/AdminEmptyState';
import AdminErrorAlert from '@/components/common/admin-shell/AdminErrorAlert';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';
import { resolveEmptyMessage } from '@/components/common/admin-shell/utils';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { RejectImageSectionDialog } from './components/RejectImageSectionDialog';
import ImagePageCard from './components/ImagePageCard';
import ImagePageDetailsModal from './components/ImagePageDetailsModal';
import { deleteImageSection } from './api';
import { ADMIN_IMAGE_SECTION_EDIT_ROUTE, IMAGE_SECTIONS_MESSAGES, IMAGE_SECTION_TEST_IDS } from './constants';
import { useImageSections, useRefreshImageSectionsPending } from './hooks';

export default function ImageSectionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const refreshPending = useRefreshImageSectionsPending();

  const {
    filteredSections, loading, isFiltering, error, setError,
    searchTerm, setSearchTerm, fetchSections,
  } = useImageSections();

  const [sectionToDelete, setSectionToDelete] = useState<SectionData | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [sectionToReject, setSectionToReject] = useState<SectionData | null>(null);

  useEffect(() => { void fetchSections(); }, [fetchSections]);

  const handleEdit = (section: SectionData) => {
    dispatch(setData(section));
    navigate(ADMIN_IMAGE_SECTION_EDIT_ROUTE);
  };

  const handleDelete = async () => {
    if (!sectionToDelete) return;
    const id = sectionToDelete.id;
    setSectionToDelete(null);
    try {
      await deleteImageSection(id || '');
      void refreshPending();
      await fetchSections();
    } catch (failure: unknown) {
      console.error('Falha ao apagar a publicação', failure);
      setError(IMAGE_SECTIONS_MESSAGES.DELETE_FAILED);
    }
  };

  const showSkeleton = (loading || isFiltering) && filteredSections.length === 0;

  return (
    <AdminPageShell testId={IMAGE_SECTION_TEST_IDS.MANAGER} title={IMAGE_SECTIONS_MESSAGES.TITLE}>
      <AdminSearchBar
        testId={IMAGE_SECTION_TEST_IDS.SEARCH}
        clearTestId={IMAGE_SECTION_TEST_IDS.SEARCH_CLEAR}
        refreshTestId={IMAGE_SECTION_TEST_IDS.REFRESH}
        label="Buscar publicações"
        placeholder="Buscar por legenda ou descrição..."
        ariaLabel="Buscar seções de imagens"
        value={searchTerm}
        onChange={setSearchTerm}
        onRefresh={fetchSections}
        loading={isFiltering}
      />

      {showSkeleton ? (
        <AdminListSkeleton testId={IMAGE_SECTION_TEST_IDS.LOADING} withCover />
      ) : error ? (
        <AdminErrorAlert testId={IMAGE_SECTION_TEST_IDS.ERROR} message={error} onClose={() => setError('')} />
      ) : filteredSections.length === 0 ? (
        <AdminEmptyState
          testId={IMAGE_SECTION_TEST_IDS.EMPTY}
          message={resolveEmptyMessage(Boolean(searchTerm), IMAGE_SECTIONS_MESSAGES.EMPTY)}
          icon={<Collections sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
        />
      ) : (
        <AdminCardGrid testId={IMAGE_SECTION_TEST_IDS.LIST}>
          {filteredSections.map((section) => (
            <ImagePageCard
              key={section.id}
              section={section}
              onDelete={setSectionToDelete}
              onEdit={handleEdit}
              onViewDetails={setSelectedSection}
              onReject={setSectionToReject}
            />
          ))}
        </AdminCardGrid>
      )}

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
          void fetchSections();
        }}
      />

      <ImagePageDetailsModal
        section={selectedSection}
        open={!!selectedSection}
        onClose={() => setSelectedSection(null)}
      />
    </AdminPageShell>
  );
}
