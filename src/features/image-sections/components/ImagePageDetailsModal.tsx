import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Stack, Paper, Grid, Box, useMediaQuery
} from '@mui/material';
  import { useTheme } from '@mui/material/styles';
import { SectionData, setData } from '@/store/slices/image-section/imageSectionSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MediaType } from '@/store/slices/types';
import { ADMIN_IMAGE_SECTION_EDIT_ROUTE, TOUCH_TARGET_PX } from '../constants';
import { formatDatePtBr, mediaSummary } from '../utils';
import { ShelterMediaPreview } from './ShelterMediaPreview';

interface Props {
  section: SectionData | null;
  open: boolean;
  onClose: () => void;
}

export default function ImagePageDetailsModal({ section, open, onClose }: Props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleEdit = (s: SectionData) => {
    dispatch(setData(s));
    navigate(ADMIN_IMAGE_SECTION_EDIT_ROUTE);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="dialog-title"
      data-testid="image-section-details"
      sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
    >
      <DialogTitle id="dialog-title">Detalhes da publicação</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        {section ? (
          <Stack spacing={3} mt={0.5}>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">Informações Gerais</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="body1"><strong>Legenda:</strong> {section.caption || 'Não informado'}</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      <strong>Descrição:</strong> {section.description || 'Não informado'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="body1" data-testid="image-section-details-author">
                      <strong>Enviado por:</strong> {section.author?.displayName ?? 'Autor não informado'}
                    </Typography>
                    <Typography variant="body1"><strong>Criado em:</strong> {formatDatePtBr(section.createdAt)}</Typography>
                    <Typography variant="body1"><strong>Atualizado em:</strong> {formatDatePtBr(section.updatedAt)}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Fotos e vídeo ({mediaSummary(section.mediaItems)})
              </Typography>
              {(section.mediaItems?.length ?? 0) > 0 ? (
                <Box
                  data-testid="image-section-details-media"
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                    gap: 1.5,
                  }}
                >
                  {section.mediaItems!.map((item, index) => (
                    <Box
                      key={item.id ?? index}
                      sx={{ minWidth: 0, gridColumn: item.mediaType === MediaType.VIDEO ? '1 / -1' : undefined }}
                    >
                      <ShelterMediaPreview media={item} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Nenhuma mídia disponível.</Typography>
              )}
            </Paper>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">Nenhuma seção selecionada.</Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 1.5,
          alignItems: isMobile ? 'stretch' : 'center',
          p: { xs: 2, sm: 2.5 },
        }}
      >
        {section && (
          <Button
            onClick={() => handleEdit(section)}
            variant="contained"
            color="secondary"
            aria-label="Editar e publicar"
            data-testid="image-section-details-edit"
            sx={{ width: isMobile ? '100%' : 'auto', minHeight: TOUCH_TARGET_PX }}
          >
            Editar e publicar
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          aria-label="Fechar modal"
          sx={{ width: isMobile ? '100%' : 'auto', minHeight: TOUCH_TARGET_PX }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
