import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CloudUploadOutlined,
  DeleteOutline,
  PhotoLibraryOutlined,
  VideocamOutlined,
} from '@mui/icons-material';
import { MediaType } from '@/store/slices/types';
import type { ShelterMediaEditorProps } from '../types';
import {
  SHELTER_CAPTION_MAX_LENGTH,
  SHELTER_IMAGE_ACCEPT,
  SHELTER_MAX_PHOTOS,
  SHELTER_VIDEO_ACCEPT,
  TOUCH_TARGET_PX,
} from '../constants';
import { countByType, toShelterUploadMedia, validateShelterSelection } from '../media-utils';
import { ShelterMediaPreview } from './ShelterMediaPreview';

/**
 * Editor de uma publicação: título, descrição e mídia (até 10 fotos E 1 vídeo
 * no mesmo post). Serve ao envio do membro e à revisão do admin.
 */
export function ShelterMediaEditor({
  initialCaption,
  initialDescription,
  initialMediaItems,
  onChange,
  captionPlaceholder = 'Ex.: Abrigo São Lucas — Visita de sábado com as crianças',
  descriptionPlaceholder = 'Conte o que aconteceu nesta visita e o que tornou esse momento especial.',
  disabled = false,
  isEditMode = false,
}: ShelterMediaEditorProps) {
  const [error, setError] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const { photos, videos } = countByType(initialMediaItems);

  const addFiles = (files: File[], mediaType: MediaType) => {
    if (disabled) return;
    const message = validateShelterSelection({
      files,
      mediaType,
      currentPhotos: photos,
      currentVideos: videos,
    });
    setError(message ?? '');
    if (!message && files.length) {
      onChange({
        mediaItems: [...initialMediaItems, ...files.map((file) => toShelterUploadMedia(file, mediaType))],
      });
    }
  };

  /** Arrastar/soltar: cada arquivo vai para o tipo certo pelo MIME. */
  const addDropped = (files: File[]) => {
    const videosDropped = files.filter((file) => file.type.startsWith('video/'));
    const photosDropped = files.filter((file) => !file.type.startsWith('video/'));
    if (photosDropped.length) addFiles(photosDropped, MediaType.IMAGE);
    if (videosDropped.length) addFiles(videosDropped, MediaType.VIDEO);
  };

  return (
    <Box
      data-testid="shelter-upload-editor"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.25fr) minmax(0, 1fr)' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={1} flexWrap="wrap">
          <Typography component="h2" variant="h6" fontWeight={700}>
            1. Escolha o registro
          </Typography>
          <Stack direction="row" gap={0.5}>
            <Chip data-testid="shelter-upload-photos-count" size="small" label={`${photos}/${SHELTER_MAX_PHOTOS} fotos`} />
            <Chip data-testid="shelter-upload-videos-count" size="small" label={`${videos}/1 vídeo`} />
          </Stack>
        </Stack>
        {error && (
          <Alert data-testid="shelter-upload-validation" severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addDropped(Array.from(event.dataTransfer.files));
          }}
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            textAlign: 'center',
            p: { xs: 2, sm: 3 },
            bgcolor: 'action.hover',
          }}
        >
          <CloudUploadOutlined color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography fontWeight={600}>Cada foto e cada vídeo contam a visita</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
            Fotos JPG, PNG, WebP ou GIF (até 10 MB cada) e um vídeo MP4, WebM ou MOV (até 100 MB).
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} justifyContent="center">
            <Button
              data-testid="shelter-upload-photos-button"
              type="button"
              variant="outlined"
              startIcon={<PhotoLibraryOutlined />}
              disabled={disabled || photos >= SHELTER_MAX_PHOTOS}
              onClick={() => photoInput.current?.click()}
              sx={{ minHeight: TOUCH_TARGET_PX }}
            >
              Selecionar fotos
            </Button>
            <Button
              data-testid="shelter-upload-video-button"
              type="button"
              variant="outlined"
              startIcon={<VideocamOutlined />}
              disabled={disabled || videos >= 1}
              onClick={() => videoInput.current?.click()}
              sx={{ minHeight: TOUCH_TARGET_PX }}
            >
              Selecionar vídeo
            </Button>
          </Stack>
          <input
            ref={photoInput}
            data-testid="shelter-upload-photos-input"
            type="file"
            hidden
            multiple
            disabled={disabled}
            accept={SHELTER_IMAGE_ACCEPT}
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []), MediaType.IMAGE);
              event.target.value = '';
            }}
          />
          <input
            ref={videoInput}
            data-testid="shelter-upload-video-input"
            type="file"
            hidden
            disabled={disabled}
            accept={SHELTER_VIDEO_ACCEPT}
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []), MediaType.VIDEO);
              event.target.value = '';
            }}
          />
          <Typography variant="caption" display="block" color="text.secondary" mt={1}>
            Ou arraste os arquivos até aqui
          </Typography>
        </Box>
        {initialMediaItems.length > 0 && (
          <Box
            data-testid="shelter-upload-previews"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: 1.5,
              mt: 2,
            }}
          >
            {initialMediaItems.map((media, index) => {
              const label = media.originalName || media.title || `Arquivo ${index + 1}`;
              const isVideo = media.mediaType === MediaType.VIDEO;
              return (
                <Box
                  key={media.id ?? `${media.originalName}-${index}`}
                  data-testid={isVideo ? 'shelter-upload-preview-video' : 'shelter-upload-preview-photo'}
                  sx={{ minWidth: 0, gridColumn: isVideo ? '1 / -1' : undefined }}
                >
                  <ShelterMediaPreview media={media} />
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
                    <Typography variant="caption" noWrap sx={{ minWidth: 0, flex: 1 }}>
                      {label}
                    </Typography>
                    <IconButton
                      data-testid="shelter-upload-remove"
                      disabled={disabled}
                      aria-label={`Remover ${label}`}
                      onClick={() => {
                        onChange({ mediaItems: initialMediaItems.filter((_, position) => position !== index) });
                        setError('');
                      }}
                      sx={{ minWidth: TOUCH_TARGET_PX, minHeight: TOUCH_TARGET_PX }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, minWidth: 0 }}>
        <Stack spacing={2.5}>
          <Typography component="h2" variant="h6" fontWeight={700}>
            2. Conte essa história
          </Typography>
          <TextField
            required
            fullWidth
            label="Título da publicação"
            value={initialCaption}
            disabled={disabled}
            placeholder={captionPlaceholder}
            inputProps={{ maxLength: SHELTER_CAPTION_MAX_LENGTH, 'data-testid': 'shelter-upload-caption' }}
            onChange={(event) => onChange({ caption: event.target.value })}
            helperText="Inclua o nome do abrigo para facilitar a identificação."
          />
          <TextField
            required
            fullWidth
            multiline
            minRows={5}
            label="Descrição"
            value={initialDescription}
            disabled={disabled}
            placeholder={descriptionPlaceholder}
            inputProps={{ 'data-testid': 'shelter-upload-description' }}
            onChange={(event) => onChange({ description: event.target.value })}
          />
          {!isEditMode && (
            <Alert severity="info">
              Seu envio passa pela revisão da equipe antes de aparecer no feed. O nome de quem enviou
              acompanha a publicação.
            </Alert>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
