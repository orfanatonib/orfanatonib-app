import { useState } from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import { VideoLibrary } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { VideoPageData } from './types';

import { useVideoPages } from './hooks';
import { videoPageEditPath } from './utils';
import { VIDEO_PAGES_MESSAGES } from './constants';
import VideoPageCard from './components/VideoPageCard';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import VideoPageDetailsModal from './components/VideoPageDetailsModal';
import AdminPageShell from '@/components/common/admin-shell/AdminPageShell';
import AdminSearchBar from '@/components/common/admin-shell/AdminSearchBar';
import AdminListSkeleton from '@/components/common/admin-shell/AdminListSkeleton';
import AdminEmptyState from '@/components/common/admin-shell/AdminEmptyState';
import AdminErrorAlert from '@/components/common/admin-shell/AdminErrorAlert';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';
import { resolveEmptyMessage } from '@/components/common/admin-shell/utils';

export default function VideosManager() {
  const navigate = useNavigate();
  const {
    pages,
    filtered,
    loading,
    error,
    search,
    setSearch,
    fetchPages,
    removePage,
    setError,
  } = useVideoPages();

  const [selectedPage, setSelectedPage] = useState<VideoPageData | null>(null);
  const [pageToDelete, setPageToDelete] = useState<VideoPageData | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleEdit = (page: VideoPageData) => {
    if (page.id) navigate(videoPageEditPath(page.id));
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;
    try {
      await removePage(pageToDelete.id || '');
      setSnackbar({ open: true, message: 'Página excluída com sucesso.', severity: 'success' });
    } catch {
      setError('Erro ao deletar página');
      setSnackbar({ open: true, message: 'Erro ao excluir página.', severity: 'error' });
    } finally {
      setPageToDelete(null);
    }
  };

  const isFiltering = pages.length > 0 && pages.length !== filtered.length;
  const showSkeleton = loading && filtered.length === 0;

  return (
    <AdminPageShell testId="video-pages-manager" title={VIDEO_PAGES_MESSAGES.TITLE}>
      <AdminSearchBar
        testId="video-pages-search"
        clearTestId="video-pages-search-clear"
        refreshTestId="video-pages-refresh"
        label="Buscar páginas"
        value={search}
        onChange={setSearch}
        onRefresh={fetchPages}
        loading={isFiltering}
      />

      {showSkeleton ? (
        <AdminListSkeleton testId="video-pages-loading" withCover={false} />
      ) : error ? (
        <AdminErrorAlert testId="video-pages-error" message={error} onClose={() => setError('')} />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          testId="video-pages-empty"
          message={
            isFiltering
              ? VIDEO_PAGES_MESSAGES.EMPTY_FILTERED
              : resolveEmptyMessage(Boolean(search), VIDEO_PAGES_MESSAGES.EMPTY)
          }
          icon={<VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
        />
      ) : (
        <AdminCardGrid testId="video-pages-list">
          {filtered.map((page) => (
            <VideoPageCard
              key={page.id}
              page={page}
              onView={() => setSelectedPage(page)}
              onEdit={() => handleEdit(page)}
              onDelete={() => setPageToDelete(page)}
            />
          ))}
        </AdminCardGrid>
      )}

      <DeleteConfirmationModal
        open={!!pageToDelete}
        testId="video-pages-delete-modal"
        description={`Você está prestes a excluir permanentemente: ${pageToDelete?.title ?? "esta página"}.`}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleDelete}
      />

      <VideoPageDetailsModal
        page={selectedPage}
        open={!!selectedPage}
        onClose={() => setSelectedPage(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          data-testid="video-pages-snackbar"
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{
            borderRadius: 2,
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </AdminPageShell>
  );
}
