import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import ImageItem from './ImageItem';
import { MediaItem } from 'store/slices/types';
import { useState } from 'react';

interface ImageSectionProps {
  mediaItems: MediaItem[];
  caption: string;
  description: string;
  isPublic: boolean;
  onCaptionChange: (caption: string) => void;
  onDescriptionChange: (description: string) => void;
  onPublicChange: (value: boolean) => void;
  onRemoveMedia: (mediaIndex: number) => void;
  onOpenModal: () => void;
  onRemoveSection: () => void;
}

export default function ImageSection({
  mediaItems,
  caption,
  description,
  isPublic,
  onCaptionChange,
  onDescriptionChange,
  onPublicChange,
  onRemoveMedia,
  onOpenModal,
  onRemoveSection,
}: ImageSectionProps) {
  const [touched, setTouched] = useState({ caption: false, description: false });
  const isCaptionEmpty = caption.trim() === '';
  const isDescriptionEmpty = description.trim() === '';

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 4,
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        bgcolor: 'background.paper',
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          📸 Seção de Imagens
        </Typography>
        <IconButton
          color="error"
          onClick={onRemoveSection}
          sx={{
            '&:hover': {
              bgcolor: 'error.lighter',
            },
          }}
        >
          <Delete />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ImageItem mediaItems={mediaItems} onRemoveMedia={onRemoveMedia} />
          <Button
            variant="contained"
            fullWidth
            onClick={onOpenModal}
            sx={{
              mt: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              transition: 'all 0.2s ease',
            }}
          >
            + Adicionar Imagem
          </Button>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Título/Legenda da seção"
            required
            value={caption}
            onChange={(e) => {
              onCaptionChange(e.target.value);
              if (touched.caption) setTouched((prev) => ({ ...prev, caption: false }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, caption: true }))}
            error={touched.caption && isCaptionEmpty}
            helperText={touched.caption && isCaptionEmpty ? 'A legenda da seção é obrigatória.' : ''}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover:not(.Mui-error)': {
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
              '& .MuiFormHelperText-root': {
                marginLeft: 0,
                marginTop: 1,
                fontSize: '0.75rem',
              },
            }}
          />

          <TextField
            fullWidth
            label="Descrição da seção"
            required
            value={description}
            onChange={(e) => {
              onDescriptionChange(e.target.value);
              if (touched.description) setTouched((prev) => ({ ...prev, description: false }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
            error={touched.description && isDescriptionEmpty}
            helperText={touched.description && isDescriptionEmpty ? 'A descrição da seção é obrigatória.' : ''}
            multiline
            rows={4}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover:not(.Mui-error)': {
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
              '& .MuiFormHelperText-root': {
                marginLeft: 0,
                marginTop: 1,
                fontSize: '0.75rem',
              },
            }}
          />

          <FormControlLabel
            control={
              <Switch checked={isPublic} onChange={(e) => onPublicChange(e.target.checked)} />
            }
            label="Seção pública"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
