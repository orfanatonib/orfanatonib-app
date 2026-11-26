import React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { Lightbulb } from '@mui/icons-material';

import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';
import AdminListScreen from '@/components/common/admin-shell/AdminListScreen';
import AdminCardGrid from '@/components/common/admin-shell/AdminCardGrid';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import IdeasPageCard from './components/IdeasPageCard';
import IdeasPageDetailsModal from './components/IdeasPageDetailsModal';
import { useIdeasPagesList } from './hooks';
import {
  IDEAS_PAGES_FILTER_FIELDS,
  IDEAS_PAGES_MESSAGES,
  IDEAS_PAGES_TEST_ID_PREFIX,
} from './constants';

export default function IdeasManager() {
  const { list, mutError, setMutError, deletePage } = useIdeasPagesList();

  const [pageToDelete, setPageToDelete] = React.useState<IdeasPageData | null>(null);
  const [selectedPage, setSelectedPage] = React.useState<IdeasPageData | null>(null);

  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;
    const id = pageToDelete.id || '';
    setPageToDelete(null);
    await deletePage(id);
  };

  return (
    <AdminListScreen
      testIdPrefix={IDEAS_PAGES_TEST_ID_PREFIX}
      title={IDEAS_PAGES_MESSAGES.TITLE}
      searchLabel={IDEAS_PAGES_MESSAGES.SEARCH_LABEL}
      searchPlaceholder={IDEAS_PAGES_MESSAGES.SEARCH_PLACEHOLDER}
      fields={IDEAS_PAGES_FILTER_FIELDS}
      list={list}
      emptyMessage={IDEAS_PAGES_MESSAGES.EMPTY}
      emptyIcon={<Lightbulb sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
      overlays={
        <>
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

          <Snackbar
            open={Boolean(mutError)}
            autoHideDuration={6000}
            onClose={() => setMutError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              data-testid="ideas-pages-delete-error"
              severity="error"
              variant="filled"
              onClose={() => setMutError(null)}
              sx={{ borderRadius: 2 }}
            >
              {mutError}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId="ideas-pages-list">
        {list.items.map((page) => (
          <IdeasPageCard
            key={page.id}
            page={page}
            onView={() => setSelectedPage(page)}
            onDelete={() => setPageToDelete(page)}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
}
