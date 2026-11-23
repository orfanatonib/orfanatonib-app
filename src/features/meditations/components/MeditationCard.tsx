import { CalendarMonth, Edit, EventNote, PictureAsPdf, Schedule } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import type { AdminCardAction } from '@/components/common/admin-shell';
import { formatCreatedDate, formatDateOnly } from '@/components/common/admin-shell/dates';
import type { MeditationData } from '@/store/slices/meditation/meditationSlice';
import { MeditationPeriod } from '../types';
import { MEDITATIONS_LABELS, MEDITATIONS_TEST_ID_PREFIX, MEDITATION_PERIOD_LABELS } from '../constants';
import { periodOf } from '../utils';

interface Props {
  meditation: MeditationData;
  onDelete: (meditation: MeditationData) => void;
  onShowDays: (meditation: MeditationData) => void;
  onShowMaterial: (meditation: MeditationData) => void;
  onEdit: (meditation: MeditationData) => void;
}

const PERIOD_COLOR = {
  [MeditationPeriod.CURRENT]: 'success',
  [MeditationPeriod.UPCOMING]: 'info',
  [MeditationPeriod.PAST]: 'default',
} as const;

/** Cartão da meditação: período, nº de dias e data de criação; os dias abrem em diálogo. */
export default function MeditationCard({ meditation, onDelete, onShowDays, onShowMaterial, onEdit }: Props) {
  const p = MEDITATIONS_TEST_ID_PREFIX;
  const id = meditation.id;
  const period = periodOf(meditation);
  const daysCount = meditation.days?.length ?? 0;

  const actions: AdminCardAction[] = [
    {
      key: 'days',
      label: MEDITATIONS_LABELS.DAYS_BUTTON,
      ariaLabel: 'Ver dias da meditação',
      testId: `${p}-card-days-${id}`,
      icon: <EventNote />,
      variant: 'outlined',
      onClick: () => onShowDays(meditation),
    },
  ];
  if (meditation.media?.url) {
    actions.push({
      key: 'material',
      label: MEDITATIONS_LABELS.MATERIAL_BUTTON,
      ariaLabel: 'Ver material da meditação',
      testId: `${p}-card-material-${id}`,
      icon: <PictureAsPdf />,
      variant: 'outlined',
      onClick: () => onShowMaterial(meditation),
    });
  }
  actions.push({
    key: 'edit',
    label: MEDITATIONS_LABELS.EDIT_BUTTON,
    testId: `${p}-card-edit-${id}`,
    icon: <Edit />,
    onClick: () => onEdit(meditation),
  });

  return (
    <AdminEntityCard
      testId={`${p}-card-${id}`}
      title={meditation.topic}
      titleTestId={`${p}-card-title-${id}`}
      subtitle={`${formatDateOnly(meditation.startDate)} ${MEDITATIONS_LABELS.PERIOD_RANGE_SEPARATOR} ${formatDateOnly(meditation.endDate)}`}
      onDelete={() => onDelete(meditation)}
      deleteTestId={`${p}-card-delete-${id}`}
      deleteLabel={MEDITATIONS_LABELS.DELETE}
      meta={
        <AdminChipRow
          testId={`${p}-card-chips-${id}`}
          chips={[
            {
              key: 'period',
              label: MEDITATION_PERIOD_LABELS[period],
              testId: `${p}-card-period-${id}`,
              color: PERIOD_COLOR[period],
              icon: <Schedule />,
            },
            {
              key: 'days',
              label: `${daysCount} ${daysCount === 1 ? 'dia' : 'dias'}`,
              testId: `${p}-card-days-count-${id}`,
              icon: <CalendarMonth />,
            },
            {
              key: 'created',
              label: `${MEDITATIONS_LABELS.CREATED_AT} ${formatCreatedDate(meditation.createdAt)}`,
              testId: `${p}-card-created-${id}`,
            },
          ]}
        />
      }
      actions={actions}
    />
  );
}
