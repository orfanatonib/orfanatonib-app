import { Visibility } from '@mui/icons-material';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import AdminEntityCard from '@/components/common/admin-shell/AdminEntityCard';
import { IDEAS_PAGES_MESSAGES } from '../constants';
import { truncate } from '../utils';

interface Props {
  page: IdeasPageData;
  onView: () => void;
  onDelete: () => void;
}

/** Páginas de ideias são sempre privadas: o selo é fixo. */
export default function IdeasPageCard({ page, onView, onDelete }: Props) {
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
