import { useState } from "react";
import { Alert, Button } from "@mui/material";
import { Add as AddIcon, Assignment as ReportIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";
import { AdminCardGrid, AdminListScreen, useAdminList } from "@/components/common/admin-shell";
import type { AdminFilterField } from "@/components/common/admin-shell";

import { createVisitReport, deleteVisitReport, fetchVisitReportsPage, updateVisitReport } from "./api";
import { CreateVisitReportDto, UpdateVisitReportDto, VisitReport } from "./types";
import {
    VISIT_REPORTS_DEFAULT_SORT,
    VISIT_REPORTS_LABELS,
    VISIT_REPORTS_TEST_ID_PREFIX,
    VISIT_REPORT_FILTER_KEYS,
    VISIT_REPORT_SORT_OPTIONS,
} from "./constants";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";
import VisitReportFormModal from "./components/VisitReportFormModal";
import VisitReportDetailsModal from "./components/VisitReportDetailsModal";
import VisitReportCard from "./components/VisitReportCard";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import NoTeamLinked from "@/components/common/NoTeamLinked";
import { logger } from '@/utils/logger';

const P = VISIT_REPORTS_TEST_ID_PREFIX;
const K = VISIT_REPORT_FILTER_KEYS;

const FIELDS: AdminFilterField[] = [
    { kind: "date", key: K.VISIT_FROM, label: VISIT_REPORTS_LABELS.FILTER_VISIT_FROM },
    { kind: "date", key: K.VISIT_TO, label: VISIT_REPORTS_LABELS.FILTER_VISIT_TO },
    { kind: "date", key: K.CREATED_FROM, label: VISIT_REPORTS_LABELS.FILTER_CREATED_FROM },
    { kind: "date", key: K.CREATED_TO, label: VISIT_REPORTS_LABELS.FILTER_CREATED_TO },
    {
        kind: "select",
        key: K.SORT,
        label: VISIT_REPORTS_LABELS.FILTER_SORT,
        allLabel: null,
        options: VISIT_REPORT_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    },
];

const DEFAULT_FILTERS = { [K.SORT]: VISIT_REPORTS_DEFAULT_SORT };

export default function VisitReportsManager() {
    const { user } = useSelector((state: RootState) => state.auth);
    const isLeader = user?.role === UserRole.LEADER;

    const list = useAdminList<VisitReport>({
        fetcher: fetchVisitReportsPage,
        defaultFilters: DEFAULT_FILTERS,
        errorMessage: VISIT_REPORTS_LABELS.LOAD_ERROR,
    });

    const [formOpen, setFormOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editingReport, setEditingReport] = useState<VisitReport | null>(null);
    const [viewingReport, setViewingReport] = useState<VisitReport | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleCreate = async (data: CreateVisitReportDto | UpdateVisitReportDto) => {
        setSubmitting(true);
        setActionError(null);
        try {
            await createVisitReport(data as CreateVisitReportDto);
            setFormOpen(false);
            list.reload();
        } catch (e) {
            logger.error('Falha inesperada na operação', undefined, e);
            setActionError(getApiErrorMessage(e, VISIT_REPORTS_LABELS.SAVE_ERROR));
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data: CreateVisitReportDto | UpdateVisitReportDto) => {
        if (!editingReport) return;
        setSubmitting(true);
        setActionError(null);
        try {
            await updateVisitReport(editingReport.id, data as UpdateVisitReportDto);
            setFormOpen(false);
            setEditingReport(null);
            list.reload();
        } catch (e) {
            logger.error('Falha inesperada na operação', undefined, e);
            setActionError(getApiErrorMessage(e, VISIT_REPORTS_LABELS.SAVE_ERROR));
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteVisitReport(deleteId);
            setDeleteId(null);
            list.reload();
        } catch (e) {
            logger.error('Falha inesperada na operação', undefined, e);
            setActionError(getApiErrorMessage(e, VISIT_REPORTS_LABELS.SAVE_ERROR));
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const openEdit = (report: VisitReport) => {
        setEditingReport(report);
        setFormOpen(true);
    };

    const openCreate = () => {
        setEditingReport(null);
        setFormOpen(true);
    };

    const openDetails = (report: VisitReport) => {
        setViewingReport(report);
        setDetailsOpen(true);
    };

    if (isLeader && (!user?.leaderProfile?.teams || user.leaderProfile.teams.length === 0)) {
        return <NoTeamLinked showBackButton={false} />;
    }

    return (
        <AdminListScreen
            testIdPrefix={P}
            title={VISIT_REPORTS_LABELS.TITLE}
            searchLabel={VISIT_REPORTS_LABELS.SEARCH}
            searchPlaceholder={VISIT_REPORTS_LABELS.SEARCH_PLACEHOLDER}
            fields={FIELDS}
            list={list}
            emptyMessage={VISIT_REPORTS_LABELS.EMPTY}
            emptyIcon={<ReportIcon sx={{ fontSize: 64, color: "text.secondary" }} />}
            primaryAction={
                <Button
                    data-testid={`${P}-create`}
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                    fullWidth
                    sx={{ minHeight: 44, textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                    {VISIT_REPORTS_LABELS.CREATE}
                </Button>
            }
            overlays={
                <>
                    {actionError && (
                        <Alert
                            severity="error"
                            data-testid={`${P}-action-error`}
                            onClose={() => setActionError(null)}
                            sx={{ mt: 2 }}
                        >
                            {actionError}
                        </Alert>
                    )}

                    {formOpen && (
                        <VisitReportFormModal
                            open={formOpen}
                            onClose={() => setFormOpen(false)}
                            onSubmit={editingReport ? handleUpdate : handleCreate}
                            initialData={editingReport}
                            loading={submitting}
                        />
                    )}

                    {detailsOpen && (
                        <VisitReportDetailsModal
                            open={detailsOpen}
                            onClose={() => setDetailsOpen(false)}
                            report={viewingReport}
                        />
                    )}

                    <DeleteConfirmationModal
                        testId={`${P}-delete-dialog`}
                        open={deleteId !== null}
                        onClose={() => setDeleteId(null)}
                        onConfirm={confirmDelete}
                        loading={deleting}
                        description={VISIT_REPORTS_LABELS.DELETE_DESCRIPTION}
                    />
                </>
            }
        >
            <AdminCardGrid testId={`${P}-cards`}>
                {list.items.map((report) => (
                    <VisitReportCard
                        key={report.id}
                        report={report}
                        onView={openDetails}
                        onEdit={openEdit}
                        onDelete={(item) => setDeleteId(item.id)}
                    />
                ))}
            </AdminCardGrid>
        </AdminListScreen>
    );
}
