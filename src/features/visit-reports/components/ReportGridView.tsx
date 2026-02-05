import React from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    Divider,
    IconButton,
    Chip,
    Tooltip,
    useTheme,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Group as GroupIcon,
    LocationCity as ShelterIcon,
} from "@mui/icons-material";
import { VisitReport } from "../types";

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

interface ReportGridViewProps {
    shelterGroups: ShelterGroup[];
    onView: (report: VisitReport) => void;
    onEdit: (report: VisitReport, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function ReportGridView({ shelterGroups, onView, onEdit, onDelete }: ReportGridViewProps) {
    const theme = useTheme();

    return (
        <Box display="flex" flexDirection="column" gap={5}>
            {shelterGroups.map((shelterGroup) => (
                <Box key={shelterGroup.id}>
                    <Box display="flex" alignItems="center" gap={1} mb={2} px={1}>
                        <ShelterIcon color="action" fontSize="large" />
                        <Typography variant="h5" fontWeight="bold" sx={{ wordBreak: 'break-word', fontSize: { xs: '1.1rem', md: '1.5rem' } }}>
                            {shelterGroup.title}
                        </Typography>
                    </Box>

                    <Box display="flex" flexDirection="column" gap={3}>
                        {shelterGroup.teams.map((teamGroup) => (
                            <Box key={teamGroup.id} sx={{ pl: { xs: 1, md: 2 }, borderLeft: `4px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ fontSize: { xs: '0.95rem', md: '1rem' } }}>
                                    {teamGroup.name}
                                    {teamGroup.description && (
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, display: { xs: 'none', sm: 'inline' } }}>
                                            ({teamGroup.description})
                                        </Typography>
                                    )}
                                </Typography>

                                <Grid container spacing={2}>
                                    {teamGroup.reports.map((report) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={report.id}>
                                            <Card
                                                elevation={1}
                                                sx={{
                                                    height: '100%',
                                                    cursor: 'pointer',
                                                    transition: '0.2s',
                                                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                                                }}
                                                onClick={() => onView(report)}
                                            >
                                                <Box p={1.5} display="flex" justifyContent="space-between" alignItems="flex-start">
                                                    <Box>
                                                        <Chip
                                                            label={`#${report.schedule?.visitNumber || "?"}`}
                                                            color="primary"
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '0.7rem', mb: 0.5, mr: 1 }}
                                                        />
                                                        <Typography variant="body2" fontWeight="bold" component="span">
                                                            {report.schedule?.visitDate
                                                                ? new Date(report.schedule.visitDate).toLocaleDateString('pt-BR')
                                                                : "Sem data"}
                                                        </Typography>
                                                    </Box>

                                                    <Box display="flex" flexDirection="column">
                                                        <IconButton size="small" onClick={(e) => onEdit(report, e)} sx={{ p: 0.5 }}>
                                                            <EditIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={(e) => onDelete(report.id, e)} color="error" sx={{ p: 0.5 }}>
                                                            <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Divider />

                                                <Box display="flex" justifyContent="space-between" px={2} py={1} bgcolor="#f8f9fa">
                                                    <Tooltip title="Equipe Presente">
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="caption" fontWeight="bold">{report.teamMembersPresent || 0}</Typography>
                                                        </Box>
                                                    </Tooltip>
                                                    <Tooltip title="Total Decisões">
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <Typography variant="caption" sx={{ fontSize: 14 }}>✝️</Typography>
                                                            <Typography variant="caption" fontWeight="bold">{(report.shelteredDecisions || 0) + (report.caretakersDecisions || 0)}</Typography>
                                                        </Box>
                                                    </Tooltip>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}
                    </Box>
                </Box>
            ))}
        </Box>
    );
}
