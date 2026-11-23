import { CalendarMonth, Layers, Lightbulb, PhotoLibrary, Visibility } from '@mui/icons-material';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import AdminMetaChips from '@/components/common/admin-shell/AdminMetaChips';
import { formatAdminDate } from '@/components/common/admin-shell/formatAdminDate';
import { IDEAS_PAGES_MESSAGES } from '../constants';
import { coverImageUrl, countMedias, truncate } from '../utils';

interface Props {
  page: IdeasPageData;
  onView: () => void;
  onDelete: () => void;
}

/** Páginas de ideias são sempre privadas: o selo é fixo. */
export default function IdeasPageCard({ page, onView, onDelete }: Props) {
  const cover = coverImageUrl(page);
  const created = formatAdminDate(page.createdAt);
  const sections = page.sections?.length ?? 0;
  const medias = countMedias(page);

  return (
    <AdminEntityCard
      testId={`ideas-page-card-${page.id}`}
      title={page.title}
      titleTestId={`ideas-page-card-title-${page.id}`}
      subtitle={page.subtitle || undefined}
      description={truncate(page.description, 100)}
      visibility={{
        isPublic: false,
        label: IDEAS_PAGES_MESSAGES.PRIVATE_LABEL,
        testId: `ideas-page-card-visibility-${page.id}`,
      }}
      cover={
        cover ? (
          <img
            data-testid={`ideas-page-card-cover-${page.id}`}
            src={cover}
            alt={page.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Lightbulb fontSize="large" color="disabled" />
        )
      }
      meta={
        <AdminMetaChips
          chips={[
            {
              key: 'sections',
              label: `${sections} ${sections === 1 ? 'seção' : 'seções'}`,
              icon: <Layers fontSize="small" />,
              testId: `ideas-page-card-sections-${page.id}`,
            },
            {
              key: 'medias',
              label: `${medias} ${medias === 1 ? 'mídia' : 'mídias'}`,
              icon: <PhotoLibrary fontSize="small" />,
              testId: `ideas-page-card-medias-${page.id}`,
            },
            ...(created
              ? [{
                  key: 'created',
                  label: created,
                  icon: <CalendarMonth fontSize="small" />,
                  testId: `ideas-page-card-created-${page.id}`,
                }]
              : []),
          ]}
        />
      }
      onDelete={onDelete}
      deleteTestId={`ideas-page-card-delete-${page.id}`}
      deleteLabel="Excluir página"
      actions={[
        {
          key: 'view',
          label: 'Ver detalhes',
          ariaLabel: `Ver detalhes da página ${page.title}`,
          icon: <Visibility />,
          onClick: onView,
          testId: `ideas-page-card-view-${page.id}`,
        },
      ]}
    />
  );
}
