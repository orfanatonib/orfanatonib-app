import { useEffect, useState } from 'react';
import { Lightbulb } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import IdeasSectionCard from './components/IdeasSectionCard';
import IdeasSectionDetailsModal from './components/IdeasSectionDetailsModal';
import { deleteIdeasSection } from './api';
import { ideasSectionErrorMessage } from './errors';
import { IDEAS_SECTION_MESSAGES } from './constants';
import { useIdeasSections } from './hooks';
import { useRefreshPendingCounts } from '@/features/admin-pending-counts';
import { IdeasSection as IdeasSectionType } from './types';
import { buildEditSectionPath } from './utils';
import AdminPageShell from '@/components/common/admin-shell/AdminPageShell';
import AdminSearchBar from '@/components/common/admin-shell/AdminSearchBar';
import AdminListSkeleton from '@/components/common/admin-shell/AdminListSkeleton';
import AdminEmptyState from '@/components/common/admin-shell/AdminEmptyState';
import AdminErrorAlert from '@/components/common/admin-shell/AdminErrorAlert';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';
import { resolveEmptyMessage } from '@/components/common/admin-shell/utils';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

export default function IdeasSectionManager() {
  const navigate = useNavigate();
  const refreshPending = useRefreshPendingCounts();

  const {
    filteredSections,
    loading,
    isFiltering,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    fetchSections,
  } = useIdeasSections();

  const [sectionToDelete, setSectionToDelete] = useState<IdeasSectionType | null>(null);
  const [selectedSection, setSelectedSection] = useState<IdeasSectionType | null>(null);

  useEffect(() => {
    fetchSections();
    void refreshPending();
  }, [fetchSections, refreshPending]);

  const handleEdit = (section: IdeasSectionType) => {
    navigate(buildEditSectionPath(section.id));
  };

  const handleDelete = async () => {
    if (!sectionToDelete || !sectionToDelete.id) return;
    const id = sectionToDelete.id;
    setSectionToDelete(null);
    try {
      await deleteIdeasSection(id);
      await fetchSections();
      void refreshPending();
    } catch (error: unknown) {
      setError(
        ideasSectionErrorMessage(error, IDEAS_SECTION_MESSAGES.DELETE_FAILED),
      );
    }
  };

  const isBusy = loading || isFiltering;
  const hasQuery = Boolean(searchTerm);
  const showSkeleton = isBusy && filteredSections.length === 0;

  return (
    <AdminPageShell testId="ideas-sections-page" title={IDEAS_SECTION_MESSAGES.MANAGER_TITLE}>
      <AdminSearchBar
        testId="ideas-sections-search"
        clearTestId="ideas-sections-search-clear"
        refreshTestId="ideas-sections-refresh"
        label="Buscar seções"
        placeholder="Buscar por título ou descrição..."
        ariaLabel="Buscar Ideias compartilhadas"
        value={searchTerm}
        onChange={setSearchTerm}
        onRefresh={fetchSections}
        loading={isFiltering}
      />

      {showSkeleton ? (
        <AdminListSkeleton testId="ideas-sections-loading" />
      ) : error ? (
        <AdminErrorAlert testId="ideas-sections-error" message={error} onClose={() => setError('')} />
      ) : filteredSections.length === 0 ? (
        <AdminEmptyState
          testId="ideas-sections-empty"
          title={IDEAS_SECTION_MESSAGES.EMPTY_TITLE}
          message={resolveEmptyMessage(hasQuery, IDEAS_SECTION_MESSAGES.EMPTY)}
          icon={<Lightbulb sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
        />
      ) : (
        <AdminCardGrid testId="ideas-sections-list">
          {filteredSections.map((section) => (
            <IdeasSectionCard
              key={section.id}
              section={section}
              onDelete={(target) => setSectionToDelete(target)}
              onEdit={handleEdit}
              onViewDetails={(target) => setSelectedSection(target)}
            />
          ))}
        </AdminCardGrid>
      )}

      <DeleteConfirmDialog
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
    </AdminPageShell>
  );
}
