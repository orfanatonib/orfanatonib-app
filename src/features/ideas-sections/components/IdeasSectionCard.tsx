import { Chip, Stack, Typography, Box } from '@mui/material';
import { Edit as EditIcon, FolderOpen, Visibility } from '@mui/icons-material';
import { IdeasSection } from '../types';
import { truncate, getMediaTypeIcon, getMediaTypeLabel } from '../utils';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';

interface Props {
  section: IdeasSection;
  onDelete: (section: IdeasSection) => void;
  onEdit: (section: IdeasSection) => void;
  onViewDetails: (section: IdeasSection) => void;
}

export default function IdeasSectionCard({ section, onDelete, onEdit, onViewDetails }: Props) {
  const previewMedia = section.medias?.[0];
  const hasMedia = Boolean(section.medias && section.medias.length > 0);
  const mediaTypes = Array.from(new Set(section.medias?.map((m) => m.mediaType) || []));

  const cover =
    previewMedia?.mediaType === 'image' ? (
      <img
        src={previewMedia.url}
        alt={section.title || 'Miniatura'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : hasMedia ? (
      <Box sx={{ textAlign: 'center' }}>
        <FolderOpen fontSize="large" color="primary" />
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          {section.medias.length} arquivo(s)
        </Typography>
      </Box>
    ) : (
      <FolderOpen fontSize="large" color="disabled" />
    );

  return (
    <AdminEntityCard
      testId={`ideas-section-card-${section.id}`}
      title={section.title || ''}
      description={truncate(section.description)}
      cover={cover}
      onDelete={() => onDelete(section)}
      deleteTestId={`ideas-section-delete-${section.id}`}
      deleteLabel="Excluir seção"
      meta={
        mediaTypes.length > 0 ? (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {mediaTypes.map((type) => (
              <Chip
                key={type}
                size="small"
                label={`${getMediaTypeIcon(type)} ${getMediaTypeLabel(type)}`}
                variant="outlined"
                color="primary"
              />
            ))}
            <Chip size="small" label={`${section.medias.length} arquivo(s)`} variant="filled" color="secondary" />
          </Stack>
        ) : undefined
      }
      actions={[
        {
          key: 'details',
          label: 'Ver detalhes',
          icon: <Visibility />,
          onClick: () => onViewDetails(section),
          testId: `ideas-section-details-${section.id}`,
        },
        {
          key: 'edit',
          label: 'Editar e publicar',
          icon: <EditIcon />,
          variant: 'outlined',
          onClick: () => onEdit(section),
          testId: `ideas-section-edit-${section.id}`,
        },
      ]}
    />
  );
}
