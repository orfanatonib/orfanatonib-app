import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoLibrary } from '@mui/icons-material';
import type { ImagePageData, ImagePageEditState } from './types';

import { useImagePages } from './hooks';
import { IMAGE_PAGES_MESSAGES } from './constants';
import ImagePageCard from './components/ImagePageCard';
import ImagePageDetailsModal from './components/ImagePageDetailsModal';
import AdminPageShell from '@/components/common/admin-shell/AdminPageShell';
import AdminSearchBar from '@/components/common/admin-shell/AdminSearchBar';
import AdminListSkeleton from '@/components/common/admin-shell/AdminListSkeleton';
import AdminEmptyState from '@/components/common/admin-shell/AdminEmptyState';
import AdminErrorAlert from '@/components/common/admin-shell/AdminErrorAlert';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';
import { resolveEmptyMessage } from '@/components/common/admin-shell/utils';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

export default function ImagePageManager() {
  const {
    filtered,
    loading,
    isFiltering,
    error,
    search,
    setSearch,
    setError,
    fetchPages,
    removePage,
  } = useImagePages();

  const [pageToDelete, setPageToDelete] = React.useState<ImagePageData | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<ImagePageData | null>(null);

  const navigate = useNavigate();

  const handleEdit = React.useCallback(
    (page: ImagePageData) => {
      const state: ImagePageEditState = { imagePage: page };
      navigate('/adm/editar-pagina-imagens', { state });
    },
    [navigate]
  );

  const handleConfirmDelete = React.useCallback(async () => {
    if (!pageToDelete) return;
    const id = pageToDelete.id;
    setPageToDelete(null);
    try {
      await removePage(id || '');
    } catch {
      setError('Erro ao deletar página de imagens');
      await fetchPages();
    }
  }, [pageToDelete, removePage, setError, fetchPages]);

  const isBusy = loading || isFiltering;
  const showSkeleton = isBusy && filtered.length === 0;

  return (
    <AdminPageShell testId="image-pages-manager" title={IMAGE_PAGES_MESSAGES.TITLE}>
      <AdminSearchBar
        testId="image-pages-search"
        clearTestId="image-pages-search-clear"
        refreshTestId="image-pages-refresh"
        label="Buscar"
        ariaLabel="Buscar páginas de imagens"
        value={search}
        onChange={setSearch}
        onRefresh={fetchPages}
        loading={isFiltering}
      />

      {showSkeleton ? (
        <AdminListSkeleton testId="image-pages-loading" />
      ) : error ? (
        <AdminErrorAlert testId="image-pages-error" message={error} onClose={() => setError('')} />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          testId="image-pages-empty"
          message={resolveEmptyMessage(Boolean(search), IMAGE_PAGES_MESSAGES.EMPTY)}
          icon={<PhotoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
        />
      ) : (
        <AdminCardGrid testId="image-pages-list">
          {filtered.map((page) => (
            <ImagePageCard
              key={page.id}
              page={page}
              onDelete={setPageToDelete}
              onEdit={handleEdit}
              onViewDetails={setSelectedPage}
            />
          ))}
        </AdminCardGrid>
      )}

      <DeleteConfirmDialog
        testId="image-page-delete-dialog"
        open={!!pageToDelete}
        title={pageToDelete?.title || pageToDelete?.title || 'Página de imagens'}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <ImagePageDetailsModal
        page={selectedPage}
        open={!!selectedPage}
        onClose={() => setSelectedPage(null)}
      />
    </AdminPageShell>
  );
}
