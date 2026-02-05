import React from "react";
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    LocationCity as ShelterIcon,
    Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { VisitReport } from "../types";
import { Tooltip, Zoom } from "@mui/material";

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

interface ReportTableViewProps {
    shelterGroups: ShelterGroup[];
    onView: (report: VisitReport) => void;
    onEdit: (report: VisitReport, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function ReportTableView({ shelterGroups, onView, onEdit, onDelete }: ReportTableViewProps) {
    return (
        <Box display="flex" flexDirection="column" gap={5}>
            {shelterGroups.map((shelterGroup) => (
                <Box key={shelterGroup.id}>
                    <Box display="flex" alignItems="center" gap={1} mb={2} px={1}>
                        <ShelterIcon color="action" fontSize="large" />
                        <Typography variant="h5" fontWeight="bold">
                            {shelterGroup.title}
                        </Typography>
                    </Box>

                    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Visita</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Presentes</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Decisões</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Obs.</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shelterGroup.teams.map((teamGroup) => (
                                    <React.Fragment key={teamGroup.id}>
                                        <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                                            <TableCell colSpan={6} sx={{ py: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                                    {teamGroup.name}
                                                    {teamGroup.description && (
                                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                            - {teamGroup.description}
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>

                                        {teamGroup.reports.map((report) => (
                                            <TableRow
                                                key={report.id}
                                                hover
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => onView(report)}
                                            >
                                                <TableCell width="15%">
                                                    <Chip label={`#${report.schedule?.visitNumber}`} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell width="25%">
                                                    {report.schedule?.visitDate ? new Date(report.schedule.visitDate).toLocaleDateString('pt-BR') : "-"}
                                                </TableCell>
                                                <TableCell align="center" width="20%">{report.teamMembersPresent}</TableCell>
                                                <TableCell align="center" width="20%">
                                                    {(report.shelteredDecisions || 0) + (report.caretakersDecisions || 0)}
                                                </TableCell>
                                                <TableCell align="center" width="5%">
                                                    {report.observation && (
                                                        <Tooltip
                                                            title={
                                                                <Typography variant="body2" sx={{ p: 1, maxHeight: 300, overflowY: 'auto', whiteSpace: 'pre-line' }}>
                                                                    {report.observation}
                                                                </Typography>
                                                            }
                                                            arrow
                                                            TransitionComponent={Zoom}
                                                            componentsProps={{
                                                                tooltip: {
                                                                    sx: {
                                                                        bgcolor: 'common.white',
                                                                        color: 'text.primary',
                                                                        boxShadow: 3,
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        maxWidth: 300
                                                                    }
                                                                },
                                                                arrow: {
                                                                    sx: {
                                                                        color: 'common.white',
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <VisibilityIcon
                                                                fontSize="small"
                                                                color="action"
                                                                sx={{ cursor: 'help', '&:hover': { color: 'primary.main' } }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" width="20%">
                                                    <IconButton size="small" onClick={(e) => onEdit(report, e)} color="primary">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={(e) => onDelete(report.id, e)} color="error">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ))}
        </Box>
    );
}
