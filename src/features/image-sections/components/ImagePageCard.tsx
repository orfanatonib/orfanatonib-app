import { Box, Chip, Typography } from '@mui/material';
import {
  BlockOutlined,
  Edit as EditIcon,
  Image as ImageIcon,
  Lock,
  Public,
  Visibility,
  VideocamOutlined,
} from '@mui/icons-material';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { MediaType } from '@/store/slices/types';
import { REVIEW_STATUS_COLORS, REVIEW_STATUS_LABELS } from '../constants';
import { ImageSectionReviewStatus } from '../types';
import { mediaSummary, truncate } from '../utils';

interface Props {
  section: SectionData;
  onDelete: (section: SectionData) => void;
  onEdit: (section: SectionData) => void;
  onViewDetails: (section: SectionData) => void;
  onReject: (section: SectionData) => void;
}

/** Cartão da fila de revisão: capa, estado, resumo da mídia e as ações do admin. */
export default function ImagePageCard({ section, onDelete, onEdit, onViewDetails, onReject }: Props) {
  const items = section.mediaItems ?? [];
  const preview = items.find((media) => media.mediaType === MediaType.IMAGE)?.url;
  const status = section.reviewStatus ?? ImageSectionReviewStatus.PENDING;
  const rejected = status === ImageSectionReviewStatus.REJECTED;
  const hasVideo = items.some((media) => media.mediaType === MediaType.VIDEO);

  const cover = (
    <>
      {preview ? (
        <img
          src={preview}
          alt={section.caption || 'Miniatura'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : hasVideo ? (
        <VideocamOutlined data-testid="image-section-video-preview" fontSize="large" color="primary" />
      ) : (
        <ImageIcon fontSize="large" color="disabled" />
      )}
      <Chip
        label={mediaSummary(items)}
        data-testid="image-section-media-summary"
        size="small"
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          bgcolor: 'rgba(0, 0, 0, 0.75)',
          color: 'white',
          fontWeight: 600,
        }}
      />
    </>
  );

  const meta = (
    <Box>
      <Chip
        data-testid="image-section-status"
        icon={rejected ? <Lock fontSize="small" /> : <Public fontSize="small" />}
        label={REVIEW_STATUS_LABELS[status]}
        size="small"
        color={REVIEW_STATUS_COLORS[status]}
        sx={{ fontWeight: 600 }}
      />
      {rejected && (
        <Typography
          data-testid="image-section-rejection-reason"
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 1, overflowWrap: 'anywhere' }}
        >
          Motivo: {section.rejectionReason}
        </Typography>
      )}
    </Box>
  );

  return (
    <AdminEntityCard
      testId="image-section-card"
      title={section.caption || ''}
      titleTestId="image-section-title"
      description={truncate(section.description)}
      cover={cover}
      meta={meta}
      onDelete={() => onDelete(section)}
      deleteTestId="image-section-delete"
      deleteLabel="Excluir publicação"
      actions={[
        {
          key: 'view',
          label: 'Ver',
          icon: <Visibility />,
          onClick: () => onViewDetails(section),
          testId: 'image-section-view',
        },
        {
          key: 'edit',
          label: 'Editar',
          icon: <EditIcon />,
          variant: 'outlined',
          onClick: () => onEdit(section),
          testId: 'image-section-edit',
        },
        ...(rejected
          ? []
          : [
              {
                key: 'reject',
                label: 'Reprovar',
                icon: <BlockOutlined />,
                variant: 'outlined' as const,
                onClick: () => onReject(section),
                testId: 'image-section-reject',
              },
            ]),
      ]}
    />
  );
}
