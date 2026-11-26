import { Edit, InsertLink, CloudUpload, Info, Visibility } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import type { AdminCardAction } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import type { AdminChipRowItem } from '@/components/common/admin-shell/chipRow.types';
import { formatCreatedDate } from '@/components/common/admin-shell/dates';
import { MediaUploadType } from '../types';
import type { DocumentItem } from '../types';
import { DOCUMENTS_LABELS, DOCUMENTS_TEST_ID_PREFIX } from '../constants';
import { platformLabel } from '../utils';

export interface DocumentCardProps {
  document: DocumentItem;
  onPreviewFile: (doc: DocumentItem) => void;
  onViewDetails: (doc: DocumentItem) => void;
  onEdit: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

const P = DOCUMENTS_TEST_ID_PREFIX;

/** Cartão do documento: tipo (upload/link), data de criação e as ações de ver, detalhar e editar. */
export default function DocumentCard({ document, onPreviewFile, onViewDetails, onEdit, onDelete }: DocumentCardProps) {
  const id = document.id;
  const isLink = document.media?.uploadType === MediaUploadType.LINK;

  const actions: AdminCardAction[] = [
    {
      key: 'view',
      label: DOCUMENTS_LABELS.VIEW,
      ariaLabel: 'Visualizar documento',
      testId: `${P}-card-view-${id}`,
      icon: <Visibility />,
      variant: 'outlined',
      onClick: () => onPreviewFile(document),
    },
    {
      key: 'details',
      label: DOCUMENTS_LABELS.DETAILS,
      ariaLabel: 'Ver detalhes do documento',
      testId: `${P}-card-details-${id}`,
      icon: <Info />,
      variant: 'outlined',
      onClick: () => onViewDetails(document),
    },
    {
      key: 'edit',
      label: DOCUMENTS_LABELS.EDIT,
      testId: `${P}-card-edit-${id}`,
      icon: <Edit />,
      onClick: () => onEdit(document),
    },
  ];

  const chips: AdminChipRowItem[] = [
    {
      key: 'type',
      label: isLink ? DOCUMENTS_LABELS.LINK_CHIP : DOCUMENTS_LABELS.UPLOAD_CHIP,
      testId: `${P}-card-type-${id}`,
      color: isLink ? 'info' : 'primary',
      icon: isLink ? <InsertLink /> : <CloudUpload />,
    },
  ];
  if (isLink && document.media?.platformType) {
    chips.push({
      key: 'platform',
      label: platformLabel(document.media.platformType),
      testId: `${P}-card-platform-${id}`,
    });
  }
  chips.push({
    key: 'created',
    label: `${DOCUMENTS_LABELS.CREATED_AT} ${formatCreatedDate(document.createdAt)}`,
    testId: `${P}-card-created-${id}`,
  });

  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={document.name}
      titleTestId={`${P}-card-title-${id}`}
      description={document.description || DOCUMENTS_LABELS.NO_DESCRIPTION}
      onDelete={() => onDelete(document)}
      deleteTestId={`${P}-card-delete-${id}`}
      deleteLabel={DOCUMENTS_LABELS.DELETE}
      meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
      actions={actions}
    />
  );
}
