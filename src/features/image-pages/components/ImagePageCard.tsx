import { CalendarMonth, Edit as EditIcon, Image as ImageIcon, Layers, PhotoLibrary, Visibility } from '@mui/icons-material';
import { ImagePageData } from '@/features/image-pages/types';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import AdminMetaChips from '@/components/common/admin-shell/AdminMetaChips';
import { formatAdminDate } from '@/components/common/admin-shell/formatAdminDate';
import { visibilityDescriptor } from '@/components/common/admin-shell/utils';
import { countPhotos, truncate } from '../utils';

type Props = {
  page: ImagePageData;
  onDelete: (page: ImagePageData) => void;
  onEdit: (page: ImagePageData) => void;
  onViewDetails: (page: ImagePageData) => void;
};

export default function ImagePageCard({ page, onDelete, onEdit, onViewDetails }: Props) {
  const preview = page.sections?.[0]?.mediaItems?.[0]?.url;
  const isPublic = Boolean(page.public);
  const created = formatAdminDate(page.createdAt);
  const sections = page.sections?.length ?? 0;
  const photos = countPhotos(page);

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
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ImageIcon fontSize="large" color="disabled" />
        )
      }
      meta={
        <AdminMetaChips
          chips={[
            {
              key: 'sections',
              label: `${sections} ${sections === 1 ? 'seção' : 'seções'}`,
              icon: <Layers fontSize="small" />,
              testId: `image-page-sections-${page.id}`,
            },
            {
              key: 'photos',
              label: `${photos} ${photos === 1 ? 'foto' : 'fotos'}`,
              icon: <PhotoLibrary fontSize="small" />,
              testId: `image-page-photos-${page.id}`,
            },
            ...(created
              ? [{
                  key: 'created',
                  label: created,
                  icon: <CalendarMonth fontSize="small" />,
                  testId: `image-page-created-${page.id}`,
                }]
              : []),
          ]}
        />
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
