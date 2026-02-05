import React, { useState, useMemo, useEffect } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Add as AddIcon,
    GridView as GridViewIcon,
    ViewList as ListViewIcon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";

import { useVisitReports } from "./hooks";
import { VisitReport } from "./types";
import VisitReportFormModal from "./components/VisitReportFormModal";
import VisitReportDetailsModal from "./components/VisitReportDetailsModal";
import ReportGridView from "./components/ReportGridView";
import ReportTableView from "./components/ReportTableView";
import DeleteConfirmationModal from "@/components/Common/DeleteConfirmationModal";
import BackHeader from "@/components/common/header/BackHeader";

interface TeamGroup {
    id: string;
    name: string;
    description?: string;
    reports: VisitReport[];
}

interface ShelterGroup {
    id: string;
    title: string;
    teams: TeamGroup[];
}

type ViewMode = 'grid' | 'table';

export default function VisitReportsManager() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { reports, loading, error, createReport, updateReport, deleteReport } = useVisitReports();
    const theme = useTheme();

    const isAdmin = user?.role === UserRole.ADMIN;
    const isLeader = user?.role === UserRole.LEADER;
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'grid' : (isAdmin ? 'table' : 'grid'));

    useEffect(() => {
        if (isMobile) {
            setViewMode('grid');
        }
    }, [isMobile]);
    const [formOpen, setFormOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [editingReport, setEditingReport] = useState<VisitReport | null>(null);
    const [viewingReport, setViewingReport] = useState<VisitReport | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const groupedReports = useMemo<ShelterGroup[]>(() => {
        if (!user || !reports) return [];

        const shelterMap = new Map<string, { title: string, teamMap: Map<string, TeamGroup> }>();

        reports.forEach((report) => {
            if (!report || !report.team || !report.shelter) return;

            const shelterId = report.shelter.id;
            const shelterName = report.shelter.name || "Abrigo Desconhecido";
            const teamId = report.team.id;
            const teamName = `Equipe ${report.team.numberTeam}`;

            if (!shelterMap.has(shelterId)) {
                shelterMap.set(shelterId, {
                    title: shelterName,
                    teamMap: new Map(),
                });
            }

            const shelterNode = shelterMap.get(shelterId)!;

            if (!shelterNode.teamMap.has(teamId)) {
                shelterNode.teamMap.set(teamId, {
                    id: teamId,
                    name: teamName,
                    description: report.team.description,
                    reports: [],
                });
            }

            shelterNode.teamMap.get(teamId)!.reports.push(report);
        });

        return Array.from(shelterMap.entries())
            .map(([id, data]) => ({
                id,
                title: data.title,
                teams: Array.from(data.teamMap.values())
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
            }))
            .sort((a, b) => a.title.localeCompare(b.title));

    }, [reports, user]);

    const handleCreate = async (data: any) => {
        setSubmitting(true);
        try {
            await createReport(data);
            setFormOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingReport) return;
        setSubmitting(true);
        try {
            await updateReport(editingReport.id, data);
            setFormOpen(false);
            setEditingReport(null);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDeleteId(id);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteReport(deleteId);
            setDeleteOpen(false);
            setDeleteId(null);
        } catch (e) {
            console.error(e);
        } finally {
            setDeleting(false);
        }
    };

    const openEdit = (report: VisitReport, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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

    const handleViewChange = (event: React.MouseEvent<HTMLElement>, nextView: ViewMode | null) => {
        if (nextView !== null) {
            setViewMode(nextView);
        }
    };

    if (loading && reports.length === 0) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
            <BackHeader title="Relatórios das Visitas" />

            <Box display="flex" justifyContent={{ xs: "center", md: "flex-end" }} alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewChange}
                    aria-label="modo de visualização"
                    size="small"
                    sx={{ display: { xs: 'none', md: 'flex' } }}
                >
                    <ToggleButton value="grid" aria-label="visualização em grade">
                        <GridViewIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="table" aria-label="visualização em lista">
                        <ListViewIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                    sx={{ borderRadius: 2 }}
                >
                    Novo Relatório
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {
                groupedReports.length === 0 && !loading ? (
                    <Paper sx={{ p: 6, textAlign: "center", bgcolor: "#f8f9fa", borderRadius: 2 }}>
                        {isLeader && (!user?.leaderProfile?.teams || user.leaderProfile.teams.length === 0) ? (
                            <>
                                <Typography variant="h6" color="textPrimary" gutterBottom>
                                    Você não possui relatórios vinculados.
                                </Typography>
                                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                                    Você não parece estar vinculado a nenhuma equipe. Contate a liderança para liberar seu acesso e vincular você a uma equipe.
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="h6" color="textSecondary">
                                    Nenhum relatório encontrado.
                                </Typography>
                                <Button variant="outlined" sx={{ mt: 2 }} onClick={openCreate}>
                                    Criar Primeiro Relatório
                                </Button>
                            </>
                        )}
                    </Paper>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <ReportGridView
                                shelterGroups={groupedReports}
                                onView={openDetails}
                                onEdit={openEdit}
                                onDelete={handleDeleteClick}
                            />
                        ) : (
                            <ReportTableView
                                shelterGroups={groupedReports}
                                onView={openDetails}
                                onEdit={openEdit}
                                onDelete={handleDeleteClick}
                            />
                        )}
                    </>
                )
            }

            {
                formOpen && (
                    <VisitReportFormModal
                        open={formOpen}
                        onClose={() => setFormOpen(false)}
                        onSubmit={editingReport ? handleUpdate : handleCreate}
                        initialData={editingReport}
                        loading={submitting}
                    />
                )
            }

            {
                detailsOpen && (
                    <VisitReportDetailsModal
                        open={detailsOpen}
                        onClose={() => setDetailsOpen(false)}
                        report={viewingReport}
                    />
                )
            }

            <DeleteConfirmationModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={confirmDelete}
                loading={deleting}
                description="Tem certeza que deseja excluir este relatório de visita? Esta ação não pode ser desfeita."
            />
        </Box>
    );
}
