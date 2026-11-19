import { Alert, Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { REVIEW_STATUS_COLORS, REVIEW_STATUS_LABELS } from '../constants';
import type { MyImageSection } from '../types';
import { ImageSectionReviewStatus } from '../types';
import { formatDatePtBr, mediaSummary } from '../utils';

interface MyImageSectionsListProps {
  items: MyImageSection[];
  loading: boolean;
  failed: boolean;
}

/** Resumo de mídia no formato do card ("2 fotos + 1 vídeo"). */
const summaryOf = (item: MyImageSection): string =>
  mediaSummary([
    ...Array.from({ length: item.photoCount }, () => ({ mediaType: 'image' })),
    ...Array.from({ length: item.videoCount }, () => ({ mediaType: 'video' })),
  ]);

/** "Minhas publicações": status de cada envio e, se reprovada, o motivo. */
export function MyImageSectionsList({ items, loading, failed }: MyImageSectionsListProps) {
  return (
    <Paper
      data-testid="my-image-sections"
      variant="outlined"
      sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, minWidth: 0 }}
    >
      <Typography component="h2" variant="h6" fontWeight={700} mb={2}>
        Minhas publicações
      </Typography>
      {loading && items.length === 0 ? (
        <CircularProgress size={24} aria-label="Carregando suas publicações" />
      ) : failed ? (
        <Alert severity="warning">Não foi possível carregar suas publicações agora.</Alert>
      ) : items.length === 0 ? (
        <Typography data-testid="my-image-sections-empty" color="text.secondary">
          Você ainda não enviou nenhuma publicação.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Box
              key={item.id}
              data-testid="my-image-section"
              data-section-id={item.id}
              data-status={item.reviewStatus}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, minWidth: 0 }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={1}
              >
                <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
                  {item.caption}
                </Typography>
                <Chip
                  data-testid="my-image-section-status"
                  size="small"
                  color={REVIEW_STATUS_COLORS[item.reviewStatus]}
                  label={REVIEW_STATUS_LABELS[item.reviewStatus]}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block">
                {summaryOf(item)} · enviada em {formatDatePtBr(item.createdAt)}
              </Typography>
              {item.reviewStatus === ImageSectionReviewStatus.REJECTED && (
                <Alert
                  data-testid="my-image-section-reason"
                  severity="error"
                  sx={{ mt: 1, overflowWrap: 'anywhere' }}
                >
                  <strong>Motivo:</strong> {item.rejectionReason}
                </Alert>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
