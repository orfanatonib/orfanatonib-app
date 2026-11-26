import { CalendarMonth, Edit as EditIcon, Movie, Visibility, VideoLibrary } from '@mui/icons-material';
import { VideoPageData } from '../types';
import { truncate } from '../utils';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import AdminMetaChips from '@/components/common/admin-shell/AdminMetaChips';
import { formatAdminDate } from '@/components/common/admin-shell/formatAdminDate';
import { visibilityDescriptor } from '@/components/common/admin-shell/utils';

interface Props {
  page: VideoPageData;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VideoPageCard({ page, onView, onEdit, onDelete }: Props) {
  const isPublic = Boolean(page.public);
  const created = formatAdminDate(page.createdAt);
  const videos = page.videos?.length ?? 0;

  return (
    <AdminEntityCard
      testId={`video-page-card-${page.id}`}
      title={page.title || ''}
      titleTestId={`video-page-card-title-${page.id}`}
      description={truncate(page.description)}
      visibility={{
        isPublic,
        label: visibilityDescriptor(isPublic).label,
        testId: `video-page-card-visibility-${page.id}`,
      }}
      cover={<VideoLibrary fontSize="large" color="disabled" />}
      meta={
        <AdminMetaChips
          chips={[
            {
              key: 'videos',
              label: `${videos} ${videos === 1 ? 'vídeo' : 'vídeos'}`,
              icon: <Movie fontSize="small" />,
              testId: `video-page-card-videos-${page.id}`,
            },
            ...(created
              ? [{
                  key: 'created',
                  label: created,
                  icon: <CalendarMonth fontSize="small" />,
                  testId: `video-page-card-created-${page.id}`,
                }]
              : []),
          ]}
        />
      }
      onDelete={onDelete}
      deleteTestId={`video-page-card-delete-${page.id}`}
      deleteLabel="Excluir Página"
      actions={[
        {
          key: 'view',
          label: 'Ver detalhes',
          ariaLabel: `Ver detalhes da página ${page.title}`,
          icon: <Visibility />,
          onClick: onView,
          testId: `video-page-card-view-${page.id}`,
        },
        {
          key: 'edit',
          label: 'Editar',
          ariaLabel: `Editar a página ${page.title}`,
          icon: <EditIcon />,
          variant: 'outlined',
          onClick: onEdit,
          testId: `video-page-card-edit-${page.id}`,
        },
      ]}
    />
  );
}
