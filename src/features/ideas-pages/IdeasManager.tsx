import React from 'react';
import { Lightbulb } from '@mui/icons-material';

import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import IdeasPageCard from './components/IdeasPageCard';
import IdeasPageDetailsModal from './components/IdeasPageDetailsModal';
import { useIdeasMutations, useIdeasPages, useIdeasSearch } from './hooks';
import { IDEAS_PAGES_MESSAGES } from './constants';
import AdminPageShell from '@/components/common/admin-shell/AdminPageShell';
import AdminSearchBar from '@/components/common/admin-shell/AdminSearchBar';
import AdminListSkeleton from '@/components/common/admin-shell/AdminListSkeleton';
import AdminEmptyState from '@/components/common/admin-shell/AdminEmptyState';
import AdminErrorAlert from '@/components/common/admin-shell/AdminErrorAlert';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';
import { resolveEmptyMessage } from '@/components/common/admin-shell/utils';

export default function IdeasManager() {
  const { pages, loading, error, setError, fetchPages } = useIdeasPages();
  const { filtered, searchTerm, setSearchTerm, isFiltering } = useIdeasSearch(pages);
  const { mutError, setMutError, deletePage } = useIdeasMutations(fetchPages);

  const [pageToDelete, setPageToDelete] = React.useState<IdeasPageData | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<IdeasPageData | null>(null);
  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;
    const deleted = await deletePage(pageToDelete.id || '');
    if (deleted) {
      setError(null);
      setMutError(null);
    }
    setPageToDelete(null);
  };

  const anyError = error || mutError;
  const showSkeleton = loading && filtered.length === 0;

  return (
    <AdminPageShell testId="ideas-pages-manager" title={IDEAS_PAGES_MESSAGES.TITLE}>
      <AdminSearchBar
        rootTestId="ideas-toolbar"
        testId="ideas-toolbar-search"
        clearTestId="ideas-toolbar-clear"
        refreshTestId="ideas-toolbar-refresh"
        label="Buscar páginas"
        ariaLabel="Buscar por título"
        value={searchTerm}
        onChange={setSearchTerm}
        onRefresh={fetchPages}
        loading={isFiltering}
      />

      {showSkeleton ? (
        <AdminListSkeleton testId="ideas-pages-loading" withCover={false} />
      ) : anyError ? (
        <AdminErrorAlert testId="ideas-pages-error" message={anyError} onRetry={fetchPages} />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          testId="ideas-pages-empty"
          message={resolveEmptyMessage(Boolean(searchTerm), IDEAS_PAGES_MESSAGES.EMPTY)}
          icon={<Lightbulb sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
        />
      ) : (
        <AdminCardGrid testId="ideas-pages-list">
          {filtered.map((page) => (
            <IdeasPageCard
              key={page.id}
              page={page}
              onView={() => setSelectedPage(page)}
              onDelete={() => setPageToDelete(page)}
            />
          ))}
        </AdminCardGrid>
      )}

      <IdeasPageDetailsModal
        page={selectedPage}
        open={!!selectedPage}
        onClose={() => setSelectedPage(null)}
      />

      <DeleteConfirmDialog
        open={!!pageToDelete}
        testId="ideas-pages-delete-dialog"
        title={pageToDelete?.title}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminPageShell>
  );
}
