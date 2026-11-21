import { Edit as EditIcon, Visibility } from '@mui/icons-material';
import { VideoPageData } from '../types';
import { truncate } from '../utils';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import { visibilityDescriptor } from '@/components/common/admin-shell/utils';

interface Props {
  page: VideoPageData;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VideoPageCard({ page, onView, onEdit, onDelete }: Props) {
  const isPublic = Boolean(page.public);

  return (
    <AdminEntityCard
      testId="video-page-card"
      title={page.title || ''}
      titleTestId="video-page-card-title"
      description={truncate(page.description)}
      visibility={{
        isPublic,
        label: visibilityDescriptor(isPublic).label,
        testId: 'video-page-card-visibility',
      }}
      onDelete={onDelete}
      deleteTestId="video-page-card-delete"
      deleteLabel="Excluir Página"
      actions={[
        {
          key: 'view',
          label: 'Ver detalhes',
          ariaLabel: 'Ver detalhes',
          icon: <Visibility />,
          onClick: onView,
          testId: 'video-page-card-view',
        },
        {
          key: 'edit',
          label: 'Editar',
          ariaLabel: 'Editar',
          icon: <EditIcon />,
          variant: 'outlined',
          onClick: onEdit,
          testId: 'video-page-card-edit',
        },
      ]}
    />
  );
}
