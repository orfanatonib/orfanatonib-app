import { Edit, Star, Visibility } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import type { AdminCardAction } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import type { AdminChipRowItem } from '@/components/common/admin-shell/chipRow.types';
import { formatCreatedDate } from '@/components/common/admin-shell/dates';
import {
  VISIT_MATERIALS_LABELS,
  VISIT_MATERIALS_TEST_ID_PREFIX,
  VISIT_MATERIAL_TESTAMENT_LABELS,
} from '../constants';
import type { VisitMaterialPageResponseDto } from '../types';
import { materialCategoryLabels, truncate } from '../utils';

interface Props {
  material: VisitMaterialPageResponseDto;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetAsCurrent?: () => void;
}

const P = VISIT_MATERIALS_TEST_ID_PREFIX;

/** Cartão do material de visita: visibilidade, testamento, faixas, data e as ações ver, editar e tornar atual. */
export default function VisitMaterialCard({ material, onView, onEdit, onDelete, onSetAsCurrent }: Props) {
  const id = material.id;
  const isPublic = material.route.public;

  const actions: AdminCardAction[] = [
    { key: 'view', label: VISIT_MATERIALS_LABELS.VIEW, testId: `${P}-card-view-${id}`, icon: <Visibility />, onClick: onView },
    { key: 'edit', label: VISIT_MATERIALS_LABELS.EDIT, testId: `${P}-card-edit-${id}`, icon: <Edit />, variant: 'outlined', onClick: onEdit },
  ];
  if (!material.currentWeek && onSetAsCurrent) {
    actions.push({
      key: 'set-current',
      label: VISIT_MATERIALS_LABELS.SET_CURRENT,
      testId: `${P}-card-set-current-${id}`,
      icon: <Star />,
      variant: 'outlined',
      onClick: onSetAsCurrent,
    });
  }

  const chips: AdminChipRowItem[] = [];
  if (material.testament) {
    chips.push({
      key: 'testament',
      label: VISIT_MATERIAL_TESTAMENT_LABELS[material.testament],
      testId: `${P}-card-testament-${id}`,
      color: 'primary',
    });
  }
  materialCategoryLabels(material).forEach((label, index) => {
    chips.push({ key: `category-${index}`, label, testId: `${P}-card-category-${id}-${index}` });
  });
  if (material.currentWeek) {
    chips.push({
      key: 'current',
      label: VISIT_MATERIALS_LABELS.CURRENT_CHIP,
      testId: `${P}-card-current-${id}`,
      color: 'warning',
      icon: <Star />,
    });
  }
  chips.push({
    key: 'created',
    label: `Criado em ${formatCreatedDate(material.createdAt)}`,
    testId: `${P}-card-created-${id}`,
  });

  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={material.title}
      titleTestId={`${P}-card-title-${id}`}
      subtitle={material.subtitle || undefined}
      description={material.description ? truncate(material.description) : undefined}
      visibility={{
        label: isPublic ? VISIT_MATERIALS_LABELS.PUBLIC : VISIT_MATERIALS_LABELS.PRIVATE,
        isPublic,
        testId: `${P}-card-visibility-${id}`,
      }}
      onDelete={onDelete}
      deleteTestId={`${P}-card-delete-${id}`}
      deleteLabel={VISIT_MATERIALS_LABELS.DELETE}
      meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
      actions={actions}
    />
  );
}
