import { CheckCircle, Cancel, ChildCare, Home } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import type { AdminChipRowItem } from '@/components/common/admin-shell/chipRow.types';
import { formatCreatedDate } from '@/components/common/admin-shell/dates';
import { PAGELAS_LABELS, PAGELAS_TEST_ID_PREFIX } from '../constants';
import type { PagelaDto, ShelterDto, ShelteredDto } from '../types';
import { fmtDate, formatPhone } from '../utils';

const P = PAGELAS_TEST_ID_PREFIX;

/** Cartão do abrigo: leva ao nível dos acolhidos. */
export function ShelterLevelCard({ shelter, onOpen }: { shelter: ShelterDto; onOpen: (shelter: ShelterDto) => void }) {
  const id = shelter.id;
  const leaders = (shelter.leaders ?? []).map((leader) => leader.user.name).join(', ');
  const chips: AdminChipRowItem[] = [
    { key: 'members', label: `${shelter.members?.length ?? 0} membros`, testId: `${P}-card-members-${id}`, color: 'primary' },
    { key: 'created', label: `Criado em ${formatCreatedDate(shelter.createdAt)}`, testId: `${P}-card-created-${id}` },
  ];
  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={shelter.name}
      titleTestId={`${P}-card-title-${id}`}
      subtitle={[shelter.address?.city, shelter.address?.state].filter(Boolean).join(', ') || undefined}
      description={leaders ? `Líderes: ${leaders}` : shelter.address?.district || undefined}
      meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
      actions={[
        {
          key: 'open',
          label: PAGELAS_LABELS.OPEN_SHELTERED,
          testId: `${P}-card-open-${id}`,
          icon: <Home />,
          onClick: () => onOpen(shelter),
        },
      ]}
    />
  );
}

/** Cartão do acolhido: leva ao nível das pagelas. */
export function ShelteredLevelCard({
  sheltered,
  onOpen,
}: {
  sheltered: ShelteredDto;
  onOpen: (sheltered: ShelteredDto) => void;
}) {
  const id = sheltered.id;
  const chips: AdminChipRowItem[] = [
    { key: 'shelter', label: sheltered.shelter.name, testId: `${P}-card-shelter-${id}`, color: 'primary' },
    { key: 'gender', label: sheltered.gender === 'F' ? 'Feminino' : 'Masculino', testId: `${P}-card-gender-${id}` },
    { key: 'joined', label: `Entrada ${fmtDate(sheltered.joinedAt)}`, testId: `${P}-card-joined-${id}` },
  ];
  const guardian = [sheltered.guardianName, sheltered.guardianPhone ? formatPhone(sheltered.guardianPhone) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={sheltered.name}
      titleTestId={`${P}-card-title-${id}`}
      subtitle={guardian || undefined}
      meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
      actions={[
        {
          key: 'open',
          label: PAGELAS_LABELS.OPEN_PAGELAS,
          testId: `${P}-card-open-${id}`,
          icon: <ChildCare />,
          onClick: () => onOpen(sheltered),
        },
      ]}
    />
  );
}

/** Cartão da pagela: ano, visita, presença, data, anotação e o membro que registrou. */
export function PagelaRecordCard({ pagela }: { pagela: PagelaDto }) {
  const id = pagela.id;
  const chips: AdminChipRowItem[] = [
    {
      key: 'present',
      label: pagela.present ? 'Presente' : 'Ausente',
      testId: `${P}-card-present-${id}`,
      color: pagela.present ? 'success' : 'error',
      icon: pagela.present ? <CheckCircle /> : <Cancel />,
    },
    { key: 'date', label: `Data: ${fmtDate(pagela.referenceDate)}`, testId: `${P}-card-date-${id}` },
  ];
  if (pagela.member?.user?.name) {
    chips.push({ key: 'member', label: `Membro: ${pagela.member.user.name}`, testId: `${P}-card-member-${id}` });
  }
  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={`Ano ${pagela.year} - Visita ${pagela.visit}`}
      titleTestId={`${P}-card-title-${id}`}
      subtitle={pagela.sheltered?.name}
      description={pagela.notes || undefined}
      meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
    />
  );
}

