import { Edit } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import { formatCreatedDate } from '@/components/common/admin-shell/dates';
import type { InformativeBannerData } from 'store/slices/informative/informativeBannerSlice';
import { INFORMATIVES_LABELS, INFORMATIVES_TEST_ID_PREFIX } from '../constants';

interface Props {
  banner: InformativeBannerData;
  onEdit: (banner: InformativeBannerData) => void;
  onDeleteAsk: (banner: InformativeBannerData) => void;
}

const P = INFORMATIVES_TEST_ID_PREFIX;

/** Cartão do banner: selo de visibilidade, data de criação e as ações de editar/excluir. */
export default function InformativeCard({ banner, onEdit, onDeleteAsk }: Props) {
  const id = banner.id ?? '';
  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={banner.title}
      titleTestId={`${P}-card-title-${id}`}
      description={banner.description}
      visibility={{
        label: banner.public ? INFORMATIVES_LABELS.PUBLIC : INFORMATIVES_LABELS.PRIVATE,
        isPublic: banner.public,
        testId: `${P}-card-visibility-${id}`,
      }}
      onDelete={() => onDeleteAsk(banner)}
      deleteTestId={`${P}-card-delete-${id}`}
      deleteLabel={INFORMATIVES_LABELS.DELETE}
      meta={
        <AdminChipRow
          testId={`${P}-card-chips-${id}`}
          chips={[
            {
              key: 'created',
              label: `${INFORMATIVES_LABELS.CREATED_AT} ${formatCreatedDate(banner.createdAt)}`,
              testId: `${P}-card-created-${id}`,
            },
          ]}
        />
      }
      actions={[
        {
          key: 'edit',
          label: INFORMATIVES_LABELS.EDIT,
          testId: `${P}-card-edit-${id}`,
          icon: <Edit />,
          onClick: () => onEdit(banner),
        },
      ]}
    />
  );
}
