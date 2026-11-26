import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import type { ImagePageData, ImagePageEditState } from './types';

import { useImagePagesList } from './hooks';
import {
  IMAGE_PAGES_FILTER_FIELDS,
  IMAGE_PAGES_MESSAGES,
  IMAGE_PAGES_TEST_ID_PREFIX,
} from './constants';
import ImagePageCard from './components/ImagePageCard';
import ImagePageDetailsModal from './components/ImagePageDetailsModal';
import AdminListScreen from '@/components/common/admin-shell/AdminListScreen';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

export default function ImagePageManager() {
  const { list, removePage } = useImagePagesList();

  const [pageToDelete, setPageToDelete] = React.useState<ImagePageData | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<ImagePageData | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

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
    setDeleteError(null);
    try {
      await removePage(id || '');
    } catch {
      setDeleteError(IMAGE_PAGES_MESSAGES.DELETE_ERROR);
    }
  }, [pageToDelete, removePage]);

  return (
    <AdminListScreen
      testIdPrefix={IMAGE_PAGES_TEST_ID_PREFIX}
      title={IMAGE_PAGES_MESSAGES.TITLE}
      searchLabel={IMAGE_PAGES_MESSAGES.SEARCH_LABEL}
      searchPlaceholder={IMAGE_PAGES_MESSAGES.SEARCH_PLACEHOLDER}
      fields={IMAGE_PAGES_FILTER_FIELDS}
      list={list}
      emptyMessage={IMAGE_PAGES_MESSAGES.EMPTY}
      emptyIcon={<PhotoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
      overlays={
        <>
          <DeleteConfirmDialog
            testId="image-page-delete-dialog"
            open={!!pageToDelete}
            title={pageToDelete?.title || 'Página de imagens'}
            onClose={() => setPageToDelete(null)}
            onConfirm={handleConfirmDelete}
          />

          <ImagePageDetailsModal
            page={selectedPage}
            open={!!selectedPage}
            onClose={() => setSelectedPage(null)}
          />

          <Snackbar
            open={Boolean(deleteError)}
            autoHideDuration={6000}
            onClose={() => setDeleteError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              data-testid="image-pages-delete-error"
              severity="error"
              variant="filled"
              onClose={() => setDeleteError(null)}
              sx={{ borderRadius: 2 }}
            >
              {deleteError}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId="image-pages-list">
        {list.items.map((page) => (
          <ImagePageCard
            key={page.id}
            page={page}
            onDelete={setPageToDelete}
            onEdit={handleEdit}
            onViewDetails={setSelectedPage}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
