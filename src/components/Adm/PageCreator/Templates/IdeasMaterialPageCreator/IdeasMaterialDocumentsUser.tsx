import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Delete, Edit, Visibility } from '@mui/icons-material';
import { MediaItem, MediaType, MediaUploadType } from 'store/slices/types';
import MediaDocumentPreviewModal from 'utils/MediaDocumentPreviewModal';

interface DocumentsUserProps {
  documents: MediaItem[];
  setDocuments: (docs: MediaItem[]) => void;
  ideaTitle: string;
  onPendingChange: (pending: boolean) => void;
  shakeButton?: boolean;
}

export function IdeasMaterialDocumentsUser({ documents, setDocuments, ideaTitle, onPendingChange, shakeButton }: DocumentsUserProps) {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [tempDoc, setTempDoc] = useState<MediaItem>({
    title: '',
    description: '',
    mediaType: MediaType.DOCUMENT,
    uploadType: MediaUploadType.UPLOAD,
    url: '',
  });
  const [fileName, setFileName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState({ url: false });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (shakeButton && addButtonRef.current) {
      addButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [shakeButton]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const objectURL = URL.createObjectURL(file);
    setTempDoc((prev) => ({ ...prev, url: objectURL, file }));
    onPendingChange(true);
  };

  const resetForm = () => {
    setTempDoc({
      title: '',
      description: '',
      mediaType: MediaType.DOCUMENT,
      uploadType: MediaUploadType.UPLOAD,
      url: '',
    });
    setFileName('');
    setEditingIndex(null);
    setErrors({ url: false });
  };

  const handleAddOrUpdate = () => {
    const hasError = !tempDoc.url;

    setErrors({
      url: !tempDoc.url,
    });

    if (hasError) return;

    const documentNumber = editingIndex !== null ? editingIndex + 1 : documents.length + 1;
    const generatedTitle = ideaTitle.trim()
      ? `Documento ${documentNumber} da ideia "${ideaTitle}"`
      : `Documento ${documentNumber}`;
    const generatedDescription = ideaTitle.trim()
      ? `Documento ${documentNumber} para auxiliar na Ideia "${ideaTitle}"`
      : `Documento ${documentNumber}`;

    const documentWithGeneratedInfo = {
      ...tempDoc,
      title: generatedTitle,
      description: generatedDescription,
    };

    const updated =
      editingIndex !== null
        ? documents.map((doc, i) => (i === editingIndex ? documentWithGeneratedInfo : doc))
        : [...documents, documentWithGeneratedInfo];

    setDocuments(updated);
    resetForm();
  };

  const handleEdit = (index: number) => {
    setTempDoc(documents[index]);
    setFileName(documents[index].file?.name || '');
    setEditingIndex(index);
  };

  const handleRemoveClick = (index: number) => {
    setItemToDelete(index);
    setOpenDeleteDialog(true);
  };

  const confirmRemove = () => {
    if (itemToDelete !== null) {
      setDocuments(documents.filter((_, i) => i !== itemToDelete));
      setItemToDelete(null);
    }
    setOpenDeleteDialog(false);
  };

  const handlePreview = (document: MediaItem) => {
    setPreviewDocument(document);
    setOpenPreviewModal(true);
  };

  const canPreview = (document: MediaItem): boolean => {
    if (document.uploadType === MediaUploadType.UPLOAD || document.isLocalFile) {
      return true;
    }
    return false;
  };

  return (
    <Box>
      <Box sx={{
        mb: 3,
        p: 3,
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.default',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📄 Upload de Documento
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{
                py: 1.5,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#7C3AED',
                color: '#7C3AED',
                bgcolor: 'rgba(124, 58, 237, 0.05)',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#6D28D9',
                  bgcolor: 'rgba(124, 58, 237, 0.1)',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                }
              }}
            >
              Escolher Arquivo (PDF, DOC, DOCX)
              <input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleUpload} />
            </Button>
          </Grid>

          {fileName && (
            <Grid item xs={12}>
              <Box sx={{
                p: 2,
                bgcolor: 'rgba(34, 197, 94, 0.08)',
                borderRadius: 2,
                border: '2px solid',
                borderColor: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Typography variant="body2" sx={{ color: '#16A34A', fontWeight: 600, flex: 1 }}>
                  📎 Arquivo selecionado: <strong>{fileName}</strong>
                </Typography>
              </Box>
            </Grid>
          )}

          {errors.url && (
            <Grid item xs={12}>
              <Box sx={{
                p: 2,
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                borderRadius: 2,
                border: '2px solid',
                borderColor: '#EF4444'
              }}>
                <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 600 }}>
                  ⚠️ Por favor, selecione um arquivo
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              ref={addButtonRef}
              variant="contained"
              fullWidth
              onClick={handleAddOrUpdate}
              disabled={!tempDoc.url}
              sx={{
                py: 1.5,
                bgcolor: '#10B981',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  bgcolor: '#059669',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(0,0,0,0.12)',
                  color: 'rgba(0,0,0,0.26)',
                  boxShadow: 'none',
                },
                transition: 'all 0.2s ease',
                animation: shakeButton ? 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both' : 'none',
                '@keyframes shake': {
                  '10%, 90%': {
                    transform: 'translate3d(-1px, 0, 0)',
                  },
                  '20%, 80%': {
                    transform: 'translate3d(2px, 0, 0)',
                  },
                  '30%, 50%, 70%': {
                    transform: 'translate3d(-4px, 0, 0)',
                  },
                  '40%, 60%': {
                    transform: 'translate3d(4px, 0, 0)',
                  },
                },
              }}
            >
              {editingIndex !== null ? '💾 Salvar Alterações' : '➕ Adicionar Documento'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {documents.map((doc, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Box sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              bgcolor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{
                  p: 1.5,
                  bgcolor: 'primary.light',
                  borderRadius: '12px',
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '48px',
                  height: '48px',
                }}>
                  <Typography sx={{ fontSize: '1.2rem' }}>📄</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight="bold" sx={{ mb: 1, fontSize: '1.1rem' }}>
                    {doc.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {doc.description}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {canPreview(doc) && (
                  <Tooltip title="Visualizar">
                    <IconButton onClick={() => handlePreview(doc)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Editar">
                  <IconButton onClick={() => handleEdit(index)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remover">
                  <IconButton color="error" onClick={() => handleRemoveClick(index)}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={confirmRemove} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <MediaDocumentPreviewModal
        open={openPreviewModal}
        onClose={() => {
          setOpenPreviewModal(false);
          setPreviewDocument(null);
        }}
        media={previewDocument}
        title={previewDocument?.title}
      />
    </Box>
  );
}
