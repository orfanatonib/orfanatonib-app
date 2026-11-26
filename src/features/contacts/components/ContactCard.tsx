import { CheckCircle, MarkEmailRead, Phone, RadioButtonUnchecked, Schedule, Visibility } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import type { AdminCardAction } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import type { AdminChipRowItem } from '@/components/common/admin-shell/chipRow.types';
import { formatCreatedDate } from '@/components/common/admin-shell/dates';
import { CONTACTS_LABELS, CONTACTS_TEST_ID_PREFIX } from '../constants';
import type { Contact } from '../types';

const P = CONTACTS_TEST_ID_PREFIX;

interface Props {
  contact: Contact;
  onView: (contact: Contact) => void;
  onMarkRead: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

/** Cartão da mensagem: situação (lido/não lido), remetente, prévia do texto, telefone e data de recebimento. */
export default function ContactCard({ contact, onView, onMarkRead, onDelete }: Props) {
  const id = contact.id;

  const chips: AdminChipRowItem[] = [
    {
      key: 'status',
      label: contact.read ? CONTACTS_LABELS.READ : CONTACTS_LABELS.UNREAD,
      testId: `${P}-card-status-${id}`,
      color: contact.read ? 'success' : 'warning',
      icon: contact.read ? <CheckCircle /> : <RadioButtonUnchecked />,
    },
    { key: 'phone', label: contact.phone, testId: `${P}-card-phone-${id}`, icon: <Phone /> },
    {
      key: 'created',
      label: `${CONTACTS_LABELS.RECEIVED_AT} ${formatCreatedDate(contact.createdAt)}`,
      testId: `${P}-card-created-${id}`,
      icon: <Schedule />,
    },
  ];

  const actions: AdminCardAction[] = [
    {
      key: 'view',
      label: CONTACTS_LABELS.VIEW,
      testId: `${P}-card-view-${id}`,
      icon: <Visibility />,
      variant: 'outlined',
      onClick: () => onView(contact),
    },
  ];
  if (!contact.read) {
    actions.push({
      key: 'read',
      label: CONTACTS_LABELS.MARK_READ,
      testId: `${P}-card-read-${id}`,
      icon: <MarkEmailRead />,
      onClick: () => onMarkRead(contact),
    });
  }

  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={contact.name}
      titleTestId={`${P}-card-title-${id}`}
      subtitle={contact.email}
      description={contact.message}
      onDelete={() => onDelete(contact)}
      deleteTestId={`${P}-card-delete-${id}`}
      deleteLabel={CONTACTS_LABELS.DELETE}
      meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
      actions={actions}
    />
  );
}
