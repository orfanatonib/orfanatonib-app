import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    CircularProgress,
    Typography,
    Box,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";

import { CreateVisitReportDto, VisitReport } from "../types";
import { apiFetchSheltersList } from "../../shelters/api";
import { apiGetTeamsByShelter } from "../../teams/api";
import { apiListShelterSchedules, apiListMyTeams } from "../../shelter-schedule/api";
import { SimpleShelterResponseDto } from "../../shelters/types";
import { TeamResponseDto } from "../../teams/types";
import { ShelterScheduleResponseDto, MyTeamResponseDto } from "../../shelter-schedule/types";

interface VisitReportFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateVisitReportDto | any) => Promise<void>;
    initialData?: VisitReport | null;
    loading?: boolean;
}

export default function VisitReportFormModal({
    open,
    onClose,
    onSubmit,
    initialData,
    loading = false,
}: VisitReportFormModalProps) {
    const { user } = useSelector((state: RootState) => state.auth);
    const isLeader = user?.role === UserRole.LEADER;
    const isAdmin = user?.role === UserRole.ADMIN;

    const isEditing = !!initialData;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [scheduleId, setScheduleId] = useState("");
    const [teamMembersPresent, setTeamMembersPresent] = useState<number | "">("");
    const [shelteredHeardMessage, setShelteredHeardMessage] = useState<number | "">("");
    const [caretakersHeardMessage, setCaretakersHeardMessage] = useState<number | "">("");
    const [shelteredDecisions, setShelteredDecisions] = useState<number | "">("");
    const [caretakersDecisions, setCaretakersDecisions] = useState<number | "">("");
    const [observation, setObservation] = useState("");

    const [selectedShelterId, setSelectedShelterId] = useState("");
    const [selectedTeamId, setSelectedTeamId] = useState("");

    const [shelters, setShelters] = useState<SimpleShelterResponseDto[]>([]);
    const [teams, setTeams] = useState<TeamResponseDto[]>([]);
    const [myTeams, setMyTeams] = useState<MyTeamResponseDto[]>([]);
    const [schedules, setSchedules] = useState<ShelterScheduleResponseDto[]>([]);

    const [loadingShelters, setLoadingShelters] = useState(false);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [loadingSchedules, setLoadingSchedules] = useState(false);

    useEffect(() => {
        if (initialData && open) {
            setTeamMembersPresent(initialData.teamMembersPresent);
            setShelteredHeardMessage(initialData.shelteredHeardMessage);
            setCaretakersHeardMessage(initialData.caretakersHeardMessage);
            setShelteredDecisions(initialData.shelteredDecisions);
            setCaretakersDecisions(initialData.caretakersDecisions);
            setObservation(initialData.observation || "");

            setSelectedShelterId(initialData.shelter.id);
            setSelectedTeamId(initialData.team.id);
            setScheduleId(initialData.schedule.id);
        } else if (open) {
            setScheduleId("");
            setTeamMembersPresent("");
            setShelteredHeardMessage("");
            setCaretakersHeardMessage("");
            setShelteredDecisions("");
            setCaretakersDecisions("");
            setObservation("");
            setSelectedShelterId("");
            setSelectedTeamId("");
            setTeams([]);
            setMyTeams([]);
            setSchedules([]);
        }
    }, [initialData, open]);

    useEffect(() => {
        if (open && !initialData) {
            if (isAdmin) {
                setLoadingShelters(true);
                apiFetchSheltersList()
                    .then(setShelters)
                    .catch(console.error)
                    .finally(() => setLoadingShelters(false));
            } else if (isLeader) {
                setLoadingTeams(true);
                apiListMyTeams()
                    .then(setMyTeams)
                    .catch(console.error)
                    .finally(() => setLoadingTeams(false));
            }
        }
    }, [open, initialData, isAdmin, isLeader]);

    useEffect(() => {
        if (isAdmin && selectedShelterId && !initialData) {
            setLoadingTeams(true);
            apiGetTeamsByShelter(selectedShelterId)
                .then((data) => {
                    setTeams(data);
                    setSelectedTeamId("");
                    setSchedules([]);
                })
                .catch(console.error)
                .finally(() => setLoadingTeams(false));
        }
    }, [selectedShelterId, initialData, isAdmin]);

    useEffect(() => {
        if (selectedTeamId && !initialData) {
            setLoadingSchedules(true);
            apiListShelterSchedules(selectedTeamId)
                .then(setSchedules)
                .catch(console.error)
                .finally(() => setLoadingSchedules(false));
        }
    }, [selectedTeamId, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = {
            teamMembersPresent: Number(teamMembersPresent),
            shelteredHeardMessage: Number(shelteredHeardMessage),
            caretakersHeardMessage: Number(caretakersHeardMessage),
            shelteredDecisions: Number(shelteredDecisions),
            caretakersDecisions: Number(caretakersDecisions),
            observation: observation,
        };

        if (!isEditing) {
            payload.scheduleId = scheduleId;
        }

        onSubmit(payload);
    };

    const isFormValid =
        (isEditing || (selectedTeamId && scheduleId)) &&
        teamMembersPresent !== "" &&
        shelteredHeardMessage !== "" &&
        caretakersHeardMessage !== "" &&
        shelteredDecisions !== "" &&
        caretakersDecisions !== "";

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {isEditing ? "Editar Relatório de Visita" : "Novo Relatório de Visita"}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {!isEditing && (
                            <>
                                {isAdmin && (
                                    <Grid item xs={12}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Abrigo"
                                            value={selectedShelterId}
                                            onChange={(e) => setSelectedShelterId(e.target.value)}
                                            disabled={loadingShelters}
                                        >
                                            {loadingShelters ? (
                                                <MenuItem disabled><CircularProgress size={20} /></MenuItem>
                                            ) : (
                                                shelters.map((s) => {
                                                    console.log('Rendering shelter option:', s);
                                                    return (
                                                        <MenuItem key={s.id} value={s.id} sx={{ color: 'text.primary' }}>
                                                            {s.name || "Abrigo sem nome"}
                                                        </MenuItem>
                                                    );
                                                })
                                            )}
                                        </TextField>
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Equipe"
                                        value={selectedTeamId}
                                        onChange={(e) => setSelectedTeamId(e.target.value)}
                                        disabled={isAdmin ? (!selectedShelterId || loadingTeams) : loadingTeams}
                                    >
                                        {loadingTeams ? (
                                            <MenuItem disabled><CircularProgress size={20} /></MenuItem>
                                        ) : (isAdmin ? teams : myTeams).length === 0 ? (
                                            <MenuItem disabled>Nenhuma equipe encontrada</MenuItem>
                                        ) : (
                                            (isAdmin ? teams : myTeams).map((t: any) => {
                                                const label = isAdmin
                                                    ? `Equipe ${t.numberTeam} ${t.description ? `- ${t.description}` : ""}`
                                                    : `Equipe ${t.numberTeam} - ${t.shelter.name}`;

                                                return (
                                                    <MenuItem key={t.id} value={t.id} sx={{ color: 'text.primary' }}>
                                                        {label}
                                                    </MenuItem>
                                                );
                                            })
                                        )}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Agendamento (Visita)"
                                        value={scheduleId}
                                        onChange={(e) => setScheduleId(e.target.value)}
                                        disabled={!selectedTeamId || loadingSchedules}
                                        helperText={schedules.length === 0 && selectedTeamId ? "Nenhum agendamento encontrado" : "Selecione a data da visita"}
                                    >
                                        {loadingSchedules ? (
                                            <MenuItem disabled><CircularProgress size={20} /></MenuItem>
                                        ) : schedules.length === 0 ? (
                                            <MenuItem disabled>Nenhum agendamento disponível</MenuItem>
                                        ) : (
                                            schedules.map((s) => (
                                                <MenuItem key={s.id} value={s.id} sx={{ color: 'text.primary' }}>
                                                    {s.visitNumber}ª Visita - {s.visitDate ? new Date(s.visitDate).toLocaleDateString('pt-BR') : "Data indefinida"}
                                                </MenuItem>
                                            ))
                                        )}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }} />
                                    <Typography variant="subtitle1" gutterBottom>
                                        Dados do Relatório
                                    </Typography>
                                </Grid>
                            </>
                        )}

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Membros da Equipe Presentes"
                                value={teamMembersPresent}
                                onChange={(e) => setTeamMembersPresent(e.target.value === "" ? "" : Number(e.target.value))}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Acolhidos Ouviram"
                                value={shelteredHeardMessage}
                                onChange={(e) => setShelteredHeardMessage(e.target.value === "" ? "" : Number(e.target.value))}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Cuidadores Ouviram"
                                value={caretakersHeardMessage}
                                onChange={(e) => setCaretakersHeardMessage(e.target.value === "" ? "" : Number(e.target.value))}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Decisões de Acolhidos"
                                value={shelteredDecisions}
                                onChange={(e) => setShelteredDecisions(e.target.value === "" ? "" : Number(e.target.value))}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Decisões de Cuidadores"
                                value={caretakersDecisions}
                                onChange={(e) => setCaretakersDecisions(e.target.value === "" ? "" : Number(e.target.value))}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                maxRows={8}
                                label="Observações sobre a visita"
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                placeholder="Descreva como foi a visita, recepção, etc."
                                sx={{
                                    '& .MuiInputBase-root': {
                                        overflowY: 'auto'
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!isFormValid || loading}
                    >
                        {loading ? <CircularProgress size={24} /> : isEditing ? "Salvar Alterações" : "Criar Relatório"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
