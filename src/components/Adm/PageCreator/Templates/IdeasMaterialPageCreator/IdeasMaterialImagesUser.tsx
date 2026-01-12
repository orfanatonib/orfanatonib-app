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
import { Delete, Edit } from '@mui/icons-material';
import { MediaItem, MediaType, MediaUploadType } from 'store/slices/types';

interface ImagesUserProps {
  images: MediaItem[];
  setImages: (imgs: MediaItem[]) => void;
  ideaTitle: string;
  onPendingChange: (pending: boolean) => void;
  shakeButton?: boolean;
}

export function IdeasMaterialImagesUser({ images, setImages, ideaTitle, onPendingChange, shakeButton }: ImagesUserProps) {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [tempImg, setTempImg] = useState<MediaItem>({
    title: '',
    description: '',
    mediaType: MediaType.IMAGE,
    uploadType: MediaUploadType.UPLOAD,
    url: '',
  });
  const [fileName, setFileName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState({ url: false });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

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
    setTempImg((prev) => ({ ...prev, url: objectURL, file }));
    onPendingChange(true);
  };

  const resetForm = () => {
    setTempImg({
      title: '',
      description: '',
      mediaType: MediaType.IMAGE,
      uploadType: MediaUploadType.UPLOAD,
      url: '',
    });
    setFileName('');
    setEditingIndex(null);
    setErrors({ url: false });
  };

  const handleAddOrUpdate = () => {
    const hasError = !tempImg.url;

    setErrors({
      url: !tempImg.url,
    });

    if (hasError) return;

    const imageNumber = editingIndex !== null ? editingIndex + 1 : images.length + 1;
    const generatedTitle = ideaTitle.trim()
      ? `Imagem ${imageNumber} da ideia "${ideaTitle}"`
      : `Imagem ${imageNumber}`;
    const generatedDescription = ideaTitle.trim()
      ? `Imagem ${imageNumber} para auxiliar na Ideia "${ideaTitle}"`
      : `Imagem ${imageNumber}`;

    const imageWithGeneratedInfo = {
      ...tempImg,
      title: generatedTitle,
      description: generatedDescription,
    };

    const updated =
      editingIndex !== null
        ? images.map((img, i) => (i === editingIndex ? imageWithGeneratedInfo : img))
        : [...images, imageWithGeneratedInfo];

    setImages(updated);
    resetForm();
  };

  const handleEdit = (index: number) => {
    setTempImg(images[index]);
    setFileName(images[index].file?.name || '');
    setEditingIndex(index);
  };

  const handleRemoveClick = (index: number) => {
    setItemToDelete(index);
    setOpenDeleteDialog(true);
  };

  const confirmRemove = () => {
    if (itemToDelete !== null) {
      setImages(images.filter((_, i) => i !== itemToDelete));
      setItemToDelete(null);
    }
    setOpenDeleteDialog(false);
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
          🖼️ Upload de Imagem
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
                borderColor: '#EC4899',
                color: '#EC4899',
                bgcolor: 'rgba(236, 72, 153, 0.05)',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#DB2777',
                  bgcolor: 'rgba(236, 72, 153, 0.1)',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                }
              }}
            >
              Escolher Imagem (JPG, PNG, GIF, etc.)
              <input type="file" hidden accept="image/*" onChange={handleUpload} />
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

          {tempImg.url && (
            <Grid item xs={12}>
              <Box sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'rgba(236, 72, 153, 0.05)',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: '#EC4899'
              }}>
                <img
                  src={tempImg.url}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
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
                  ⚠️ Por favor, selecione uma imagem
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
              disabled={!tempImg.url}
              sx={{
                py: 1.5,
                bgcolor: '#EC4899',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
                '&:hover': {
                  bgcolor: '#DB2777',
                  boxShadow: '0 6px 16px rgba(236, 72, 153, 0.4)',
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
              {editingIndex !== null ? '💾 Salvar Alterações' : '➕ Adicionar Imagem'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2} sx={{ mt: 3 }}>
        {images.map((img, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
              <Typography fontWeight="bold">{img.title}</Typography>
              <Typography variant="body2">{img.description}</Typography>
              {img.url && (
                <img
                  src={img.url}
                  alt={img.title}
                  style={{ width: '100%', marginTop: 8, borderRadius: 4 }}
                />
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
            Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={confirmRemove} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
