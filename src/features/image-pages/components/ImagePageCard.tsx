import { Edit as EditIcon, Image as ImageIcon, Visibility } from '@mui/icons-material';
import { ImagePageData } from '@/features/image-pages/types';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import { visibilityDescriptor } from '@/components/common/admin-shell/utils';
import { truncate } from '../utils';

type Props = {
  page: ImagePageData;
  onDelete: (page: ImagePageData) => void;
  onEdit: (page: ImagePageData) => void;
  onViewDetails: (page: ImagePageData) => void;
};

export default function ImagePageCard({ page, onDelete, onEdit, onViewDetails }: Props) {
  const preview = page.sections?.[0]?.mediaItems?.[0]?.url;
  const isPublic = Boolean(page.public);

  return (
    <AdminEntityCard
      testId={`image-page-card-${page.id}`}
      title={page.title || ''}
      titleTestId={`image-page-title-${page.id}`}
      description={truncate(page.description)}
      visibility={{
        isPublic,
        label: visibilityDescriptor(isPublic).label,
        testId: `image-page-visibility-${page.id}`,
      }}
      cover={
        preview ? (
          <img
            src={preview}
            alt={page.title || 'Miniatura'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ImageIcon fontSize="large" color="disabled" />
        )
      }
      onDelete={() => onDelete(page)}
      deleteTestId={`image-page-delete-${page.id}`}
      deleteLabel="Excluir página"
      actions={[
        {
          key: 'details',
          label: 'Ver detalhes',
          icon: <Visibility />,
          onClick: () => onViewDetails(page),
          testId: `image-page-details-${page.id}`,
        },
        {
          key: 'edit',
          label: 'Editar',
          icon: <EditIcon />,
          variant: 'outlined',
          onClick: () => onEdit(page),
          testId: `image-page-edit-${page.id}`,
        },
      ]}
    />
  );
}
