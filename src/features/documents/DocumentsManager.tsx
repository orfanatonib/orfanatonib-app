import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Paper, Grid, Stack, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, IconButton, TextField,
  CircularProgress, Tooltip, useMediaQuery, useTheme, Container,
  Typography, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DescriptionIcon from '@mui/icons-material/Description';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { clearDocumentData, clearMedia, setDocumentData, setMedia } from 'store/slices/documents/documentSlice';
import { AppDispatch } from 'store/slices';
import { useNavigate } from 'react-router-dom';

import DocumentForm from './components/DocumentForm';
import DocumentCard from './components/DocumentCard';
import DocumentDetailsModal from './components/DocumentDetailsModal';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import DocumentViewModal from './components/DocumentViewModal';
import DeleteConfirmDialog from '@/components/common/modal/DeleteConfirmDialog';

import { DocumentItem } from './types';
import { deleteDocument, listDocuments } from './api';
import BackHeader from '@/components/common/header/BackHeader';

const DocumentsManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState<DocumentItem | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<DocumentItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState<DocumentItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<Pick<DocumentItem, 'id' | 'name'> | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const fetchDocuments = useCallback(async (querySearch?: string) => {
    try {
      setLoading(true);
      setIsFiltering(true);
      const data = await listDocuments(querySearch);
      setDocuments(data);
    } catch {
      setSnackbar({ open: true, message: 'Erro ao carregar documentos.', severity: 'error' });
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchDocuments]);

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
    fetchDocuments();
    setSnackbar({
      open: true,
      message: isEditing ? 'Documento atualizado com sucesso!' : 'Documento criado com sucesso!',
      severity: 'success',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalOpen) return;
    try {
      await deleteDocument(deleteModalOpen.id);
      setSnackbar({ open: true, message: 'Documento excluído com sucesso!', severity: 'success' });
      fetchDocuments();
    } catch {
      setSnackbar({ open: true, message: 'Erro ao excluir documento.', severity: 'error' });
    } finally {
      setDeleteModalOpen(null);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((p) => ({ ...p, open: false }));

  const hasQuery = Boolean(searchTerm);

  return (
    <Box data-testid="documents-manager" sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth={false} sx={{ width: { xs: '98%', md: '95%' }, mx: 'auto', px: { xs: 1, md: 2 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="📄 Gerenciar Documentos" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper
            data-testid="documents-toolbar"
            elevation={2}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              borderRadius: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                inputProps={{ "data-testid": "documents-search-input" }}
                fullWidth
                label="Buscar documentos"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {isFiltering && <CircularProgress size={20} sx={{ mr: hasQuery ? 1 : 0 }} />}
                      {hasQuery && (
                        <Tooltip title="Limpar busca">
                          <IconButton
                            size="small"
                            onClick={() => setSearchTerm('')}
                            sx={{
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                      },
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                + Documento
              </Button>
            </Stack>
          </Paper>
        </motion.div>

        {loading && documents.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              data-testid="documents-empty"
              elevation={1}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: 'background.paper',
              }}
            >
              <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhum documento encontrado
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {hasQuery
                  ? 'Tente ajustar sua busca ou limpar os filtros.'
                  : 'Ainda não há documentos cadastrados.'}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <>
            {isFiltering && documents.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 2,
                }}
              >
                <CircularProgress size={32} />
              </Box>
            )}
            <Grid data-testid="documents-cards" container spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="stretch">
              {documents.map((doc, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={doc.id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  sx={{ display: 'flex' }}
                >
                  <DocumentCard
                    document={doc}
                    onEdit={handleEdit}
                    onDelete={(d) => setDeleteModalOpen({ id: d.id, name: d.name })}
                    onViewDetails={setDetailsModalOpen}
                    onPreviewFile={setViewModalOpen}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Dialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            },
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
                <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                  {isEditing ? 'Editar Documento' : 'Novo Documento'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isEditing ? 'Atualize as informações do documento selecionado' : 'Preencha os campos para cadastrar um novo documento'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setFormOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <DocumentForm isEditing={isEditing} onSuccess={handleFormSuccess} onCancel={() => setFormOpen(false)} />
          </DialogContent>
        </Dialog>

        <DocumentDetailsModal open={!!detailsModalOpen} document={detailsModalOpen} onClose={() => setDetailsModalOpen(null)} />
        <DocumentPreviewModal open={!!previewModalOpen} document={previewModalOpen} onClose={() => setPreviewModalOpen(null)} />
        <DocumentViewModal open={!!viewModalOpen} document={viewModalOpen} onClose={() => setViewModalOpen(null)} />

        <DeleteConfirmDialog
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
            severity={snackbar.severity}
            variant="filled"
            onClose={handleCloseSnackbar}
            sx={{
              borderRadius: 2,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default DocumentsManager;
