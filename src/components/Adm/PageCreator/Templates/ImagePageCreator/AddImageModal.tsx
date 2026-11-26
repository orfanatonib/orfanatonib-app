import { useState, Fragment } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { MediaItem, MediaPlatform, MediaUploadType, MediaType } from 'store/slices/types';
import { useMediaUpload } from '../shared/useMediaUpload';
import { MediaFileKind } from '../shared/types';
import { splitCommaSeparatedUrls } from '../shared/mediaUtils';

interface AddImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (medias: MediaItem[]) => void;
}

export function AddImageModal({ isOpen, onClose, onSubmit }: AddImageModalProps) {
  const [mode, setMode] = useState<MediaUploadType>(MediaUploadType.UPLOAD);
  const upload = useMediaUpload({ kind: MediaFileKind.IMAGE, multiple: true });
  const files = upload.selections.map((item) => item.file);
  const tempUrls = upload.selections.map((item) => item.previewUrl);
  const [urlInput, setUrlInput] = useState('');
  const [platformType, setPlatformType] = useState<MediaPlatform>(MediaPlatform.ANY);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    upload.clear();
    setUrlInput('');
    setTitle('');
    setDescription('');
    setPlatformType(MediaPlatform.ANY);
    setMode(MediaUploadType.UPLOAD);
  };

  const handleRemoveImage = (index: number) => upload.removeAt(index);

  const handleSubmit = () => {
    const base: Partial<MediaItem> = {
      title: title.trim(),
      description: description.trim(),
      uploadType: mode,
      mediaType: MediaType.IMAGE,
      isLocalFile: mode === MediaUploadType.UPLOAD,
    };

    let medias: MediaItem[] = [];

    if (mode === MediaUploadType.UPLOAD && files.length > 0) {
      medias = files.map((file) => ({
        ...base,
        file,
        url: '',
        originalName: file.name,
        size: file.size,
      } as MediaItem));
    }

    if (mode === MediaUploadType.LINK && urlInput.trim()) {
      const urls = splitCommaSeparatedUrls(urlInput);
      medias = urls.map((url) => ({
        ...base,
        url,
        platformType: platformType,
        file: undefined,
      } as MediaItem));
    }

    if (medias.length > 0) {
      onSubmit(medias);
    }

    reset();
    onClose();
  };

  return (
    <Dialog data-testid="add-image-modal" open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Adicionar Nova(s) Imagem(ns)</DialogTitle>

      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Modo de envio</InputLabel>
          <Select
            data-testid="add-image-mode"
            value={mode}
            label="Modo de envio"
            onChange={(e) => setMode(e.target.value as MediaUploadType)}
          >
            <MenuItem value={MediaUploadType.UPLOAD}>Upload</MenuItem>
            <MenuItem value={MediaUploadType.LINK}>Link</MenuItem>
          </Select>
        </FormControl>

        {mode === MediaUploadType.UPLOAD && (
          <Fragment>
            <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }}>
              Upload de imagens
              <input
                data-testid="add-image-file-input"
                hidden
                type="file"
                accept={upload.accept}
                multiple
                onChange={(e) => {
                  upload.selectFiles(e.target.files);
                }}
              />
            </Button>

            {tempUrls.length > 0 && (
              <Box mt={2} textAlign="center">
                {tempUrls.map((url, index) => (
                  <Box key={index} sx={{ position: 'relative', mb: 2 }}>
                    <img
                      data-testid="add-image-preview"
                      src={url}
                      alt={`Preview ${index + 1}`}
                      style={{ maxWidth: '100%', borderRadius: 8 }}
                    />
                    <IconButton
                      data-testid="add-image-remove"
                      aria-label="Remover imagem"
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                      }}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Fragment>
        )}

        {mode === MediaUploadType.LINK && (
          <Fragment>
            <FormControl fullWidth margin="normal">
              <InputLabel>Plataforma</InputLabel>
              <Select
                value={platformType}
                label="Plataforma"
                onChange={(e) => setPlatformType(e.target.value as MediaPlatform)}
              >
                <MenuItem value={MediaPlatform.ANY}>Outro</MenuItem>
                <MenuItem value={MediaPlatform.GOOGLE_DRIVE}>Google Drive</MenuItem>
                <MenuItem value={MediaPlatform.ONEDRIVE}>OneDrive</MenuItem>
                <MenuItem value={MediaPlatform.DROPBOX}>Dropbox</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="URLs das imagens (separadas por vírgula)"
              inputProps={{ 'data-testid': 'add-image-urls' }}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              margin="normal"
            />
          </Fragment>
        )}
      </DialogContent>

      <DialogActions>
        <Button data-testid="add-image-cancel" onClick={onClose}>Cancelar</Button>
        <Button
          data-testid="add-image-submit"
          onClick={handleSubmit}
          variant="contained"
          disabled={
            mode === MediaUploadType.UPLOAD
              ? files.length === 0
              : !urlInput.trim()
          }
        >
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
