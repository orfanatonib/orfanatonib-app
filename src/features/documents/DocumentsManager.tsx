import React, { useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Snackbar, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import { useDispatch } from 'react-redux';
import { clearDocumentData, clearMedia, setDocumentData, setMedia } from 'store/slices/documents/documentSlice';
import { AppDispatch } from 'store/slices';
import { AdminCardGrid, AdminListScreen, useAdminList } from '@/components/common/admin-shell';
import type { AdminFilterField } from '@/components/common/admin-shell';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

import DocumentForm from './components/DocumentForm';
import DocumentCard from './components/DocumentCard';
import DocumentDetailsModal from './components/DocumentDetailsModal';
import DocumentViewModal from './components/DocumentViewModal';

import type { DocumentItem } from './types';
import { deleteDocument, fetchDocumentsPage } from './api';
import {
  DOCUMENTS_DEFAULT_SORT,
  DOCUMENTS_LABELS,
  DOCUMENTS_TEST_ID_PREFIX,
  DOCUMENT_FILTER_KEYS,
  DOCUMENT_SORT_OPTIONS,
  DOCUMENT_UPLOAD_TYPE_OPTIONS,
} from './constants';

const P = DOCUMENTS_TEST_ID_PREFIX;
const K = DOCUMENT_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: K.UPLOAD_TYPE,
    label: DOCUMENTS_LABELS.FILTER_TYPE,
    allLabel: DOCUMENTS_LABELS.FILTER_TYPE_ALL,
    options: DOCUMENT_UPLOAD_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  { kind: 'date', key: K.CREATED_FROM, label: DOCUMENTS_LABELS.FILTER_CREATED_FROM },
  { kind: 'date', key: K.CREATED_TO, label: DOCUMENTS_LABELS.FILTER_CREATED_TO },
  {
    kind: 'select',
    key: K.SORT,
    label: DOCUMENTS_LABELS.FILTER_SORT,
    allLabel: null,
    options: DOCUMENT_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
];

const DEFAULT_FILTERS = { [K.SORT]: DOCUMENTS_DEFAULT_SORT };

const DocumentsManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const list = useAdminList<DocumentItem>({
    fetcher: fetchDocumentsPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: DOCUMENTS_LABELS.LOAD_ERROR,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState<DocumentItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState<DocumentItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<Pick<DocumentItem, 'id' | 'name'> | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleCreate = () => {
    dispatch(clearDocumentData());
    dispatch(clearMedia());
    setIsEditing(false);
    setFormOpen(true);
  };

  const handleEdit = (doc: DocumentItem) => {
    dispatch(setDocumentData(doc as Parameters<typeof setDocumentData>[0]));
    if (doc.media) dispatch(setMedia(doc.media));
    setIsEditing(true);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    list.reload();
    setSnackbar({
      open: true,
      message: isEditing ? DOCUMENTS_LABELS.UPDATED_OK : DOCUMENTS_LABELS.CREATED_OK,
      severity: 'success',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalOpen) return;
    try {
      await deleteDocument(deleteModalOpen.id);
      setSnackbar({ open: true, message: DOCUMENTS_LABELS.DELETED_OK, severity: 'success' });
      list.reload();
    } catch {
      setSnackbar({ open: true, message: DOCUMENTS_LABELS.DELETE_ERROR, severity: 'error' });
    } finally {
      setDeleteModalOpen(null);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((p) => ({ ...p, open: false }));

  return (
    <AdminListScreen
      testIdPrefix={P}
      title={DOCUMENTS_LABELS.TITLE}
      searchLabel={DOCUMENTS_LABELS.SEARCH}
      searchPlaceholder={DOCUMENTS_LABELS.SEARCH_PLACEHOLDER}
      fields={FIELDS}
      list={list}
      emptyMessage={DOCUMENTS_LABELS.EMPTY}
      emptyIcon={<DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary' }} />}
      primaryAction={
        <Button
          data-testid={`${P}-create`}
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          fullWidth
          sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {DOCUMENTS_LABELS.CREATE}
        </Button>
      }
      overlays={
        <>
          <Dialog
            data-testid={`${P}-form-dialog`}
            open={formOpen}
            onClose={() => setFormOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: { borderRadius: 4, boxShadow: '0 24px 48px rgba(0,0,0,0.15)', overflow: 'hidden' },
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2.5,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    p: 1,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <DescriptionIcon />
                </Box>
                <Box>
                  <Typography data-testid={`${P}-form-title`} variant="h6" fontWeight={800} lineHeight={1.2}>
                    {isEditing ? DOCUMENTS_LABELS.FORM_EDIT_TITLE : DOCUMENTS_LABELS.FORM_NEW_TITLE}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isEditing ? DOCUMENTS_LABELS.FORM_EDIT_SUBTITLE : DOCUMENTS_LABELS.FORM_NEW_SUBTITLE}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                data-testid={`${P}-form-close`}
                aria-label="Fechar formulário"
                onClick={() => setFormOpen(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <DocumentForm isEditing={isEditing} onSuccess={handleFormSuccess} onCancel={() => setFormOpen(false)} />
            </DialogContent>
          </Dialog>

          <DocumentDetailsModal open={!!detailsModalOpen} document={detailsModalOpen} onClose={() => setDetailsModalOpen(null)} />
          <DocumentViewModal open={!!viewModalOpen} document={viewModalOpen} onClose={() => setViewModalOpen(null)} />

          <DeleteConfirmDialog
            testId={`${P}-delete-dialog`}
            open={!!deleteModalOpen}
            title={deleteModalOpen?.name}
            onClose={() => setDeleteModalOpen(null)}
            onConfirm={handleConfirmDelete}
          />

          <Snackbar
            open={snackbar.open}
            autoHideDuration={5000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              data-testid={`${P}-snackbar`}
              severity={snackbar.severity}
              variant="filled"
              onClose={handleCloseSnackbar}
              sx={{ borderRadius: 2 }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      }
    >
      <AdminCardGrid testId={`${P}-cards`}>
        {list.items.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onEdit={handleEdit}
            onDelete={(d) => setDeleteModalOpen({ id: d.id, name: d.name })}
            onViewDetails={setDetailsModalOpen}
            onPreviewFile={setViewModalOpen}
          />
        ))}
      </AdminCardGrid>
    </AdminListScreen>
  );
};

export default DocumentsManager;
