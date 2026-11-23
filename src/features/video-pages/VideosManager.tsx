import { useState } from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import { VideoLibrary } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { VideoPageData } from './types';

import { useVideoPagesList } from './hooks';
import { videoPageEditPath } from './utils';
import {
  VIDEO_PAGES_FILTER_FIELDS,
  VIDEO_PAGES_MESSAGES,
  VIDEO_PAGES_TEST_ID_PREFIX,
} from './constants';
import VideoPageCard from './components/VideoPageCard';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import VideoPageDetailsModal from './components/VideoPageDetailsModal';
import AdminListScreen from '@/components/common/admin-shell/AdminListScreen';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';

export default function VideosManager() {
  const navigate = useNavigate();
  const { list, removePage } = useVideoPagesList();

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
      setSnackbar({ open: true, message: VIDEO_PAGES_MESSAGES.DELETE_SUCCESS, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: VIDEO_PAGES_MESSAGES.DELETE_ERROR, severity: 'error' });
    } finally {
      setPageToDelete(null);
    }
  };

  return (
    <AdminListScreen
      testIdPrefix={VIDEO_PAGES_TEST_ID_PREFIX}
      title={VIDEO_PAGES_MESSAGES.TITLE}
      searchLabel={VIDEO_PAGES_MESSAGES.SEARCH_LABEL}
      searchPlaceholder={VIDEO_PAGES_MESSAGES.SEARCH_PLACEHOLDER}
      fields={VIDEO_PAGES_FILTER_FIELDS}
      list={list}
      emptyMessage={VIDEO_PAGES_MESSAGES.EMPTY}
      emptyIcon={<VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
      overlays={
        <>
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
        </>
      }
    >
      <AdminCardGrid testId="video-pages-list">
        {list.items.map((page) => (
          <VideoPageCard
            key={page.id}
            page={page}
            onView={() => setSelectedPage(page)}
            onEdit={() => handleEdit(page)}
            onDelete={() => setPageToDelete(page)}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
