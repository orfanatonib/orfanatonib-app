import { Edit, Visibility } from '@mui/icons-material';
import { AdminEntityCard } from '@/components/common/admin-shell';
import type { AdminCardAction } from '@/components/common/admin-shell';
import AdminChipRow from '@/components/common/admin-shell/AdminChipRow';
import type { AdminChipRowItem } from '@/components/common/admin-shell/chipRow.types';
import { formatDateOnly } from '@/components/common/admin-shell/dates';
import { VISIT_REPORTS_LABELS, VISIT_REPORTS_TEST_ID_PREFIX } from '../constants';
import type { VisitReport } from '../types';

interface Props {
    report: VisitReport;
    onView: (report: VisitReport) => void;
    onEdit: (report: VisitReport) => void;
    onDelete: (report: VisitReport) => void;
}

const P = VISIT_REPORTS_TEST_ID_PREFIX;

/** Cartão do relatório: abrigo e equipe no título, visita e data, presença/decisões e as ações ver, editar e excluir. */
export default function VisitReportCard({ report, onView, onEdit, onDelete }: Props) {
    const id = report.id;
    const decisions = (report.shelteredDecisions || 0) + (report.caretakersDecisions || 0);

    const actions: AdminCardAction[] = [
        { key: 'view', label: VISIT_REPORTS_LABELS.VIEW, testId: `${P}-card-view-${id}`, icon: <Visibility />, variant: 'outlined', onClick: () => onView(report) },
        { key: 'edit', label: VISIT_REPORTS_LABELS.EDIT, testId: `${P}-card-edit-${id}`, icon: <Edit />, onClick: () => onEdit(report) },
    ];

    const chips: AdminChipRowItem[] = [
        { key: 'visit', label: `Visita #${report.schedule?.visitNumber ?? '?'}`, testId: `${P}-card-visit-${id}`, color: 'primary' },
        {
            key: 'date',
            label: report.schedule?.visitDate ? formatDateOnly(report.schedule.visitDate) : VISIT_REPORTS_LABELS.NO_DATE,
            testId: `${P}-card-date-${id}`,
        },
        { key: 'present', label: `Equipe presente: ${report.teamMembersPresent || 0}`, testId: `${P}-card-present-${id}` },
        { key: 'decisions', label: `Decisões: ${decisions}`, testId: `${P}-card-decisions-${id}`, color: decisions > 0 ? 'success' : 'default' },
    ];

    return (
        <AdminEntityCard
            testId={`${P}-card-${id}`}
            title={report.shelter?.name || 'Abrigo Desconhecido'}
            titleTestId={`${P}-card-title-${id}`}
            subtitle={report.team ? `Equipe ${report.team.numberTeam}${report.team.description ? ` · ${report.team.description}` : ''}` : undefined}
            description={report.observation || undefined}
            onDelete={() => onDelete(report)}
            deleteTestId={`${P}-card-delete-${id}`}
            deleteLabel={VISIT_REPORTS_LABELS.DELETE}
            meta={<AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />}
            actions={actions}
        />
    );
}
