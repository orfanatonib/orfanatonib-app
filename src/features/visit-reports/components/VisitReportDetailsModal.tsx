import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Divider,
    Box,
    Chip,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { VisitReport } from "../types";
import {
    Event as EventIcon,
    Group as GroupIcon,
    LocationCity as ShelterIcon,
    Description as DescriptionIcon,
    Assessment as AssessmentIcon,
} from "@mui/icons-material";

interface VisitReportDetailsModalProps {
    open: boolean;
    onClose: () => void;
    report: VisitReport | null;
}

export default function VisitReportDetailsModal({
    open,
    onClose,
    report,
}: VisitReportDetailsModalProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!report) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Detalhes do Relatório</Typography>
                <Chip
                    label={report.schedule ? `Visita #${report.schedule.visitNumber}` : "Visita N/A"}
                    color="primary"
                    size="small"
                />
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Shelter Info */}
                    <Grid item xs={12}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <ShelterIcon color="action" />
                            <Typography variant="subtitle2" fontWeight="bold">Abrigo</Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="500">
                            {report.shelter?.name}
                        </Typography>
                        {report.shelter?.address && (
                            <Typography variant="body2" color="text.secondary">
                                {report.shelter.address.street}, {report.shelter.address.number} - {report.shelter.address.district}, {report.shelter.address.city}
                            </Typography>
                        )}
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <EventIcon color="action" />
                            <Typography variant="subtitle2" fontWeight="bold">Data da Visita</Typography>
                        </Box>
                        <Typography variant="body1">
                            {report.schedule?.visitDate
                                ? new Date(report.schedule.visitDate).toLocaleDateString('pt-BR')
                                : "Data não informada"}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <GroupIcon color="action" />
                            <Typography variant="subtitle2" fontWeight="bold">Equipe</Typography>
                        </Box>
                        <Typography variant="body1">
                            Equipe {report.team?.numberTeam}
                            {report.team?.description && ` - ${report.team.description}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Líderes: {report.team?.leaders?.map((l: any) => l.name).join(", ") || "N/A"}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <DescriptionIcon color="action" />
                            <Typography variant="subtitle2" fontWeight="bold">Conteúdo da Lição</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, maxHeight: 150, overflowY: 'auto' }}>
                            {report.schedule?.lessonContent || "Não informado"}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>



                    <Grid item xs={12}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <AssessmentIcon color="action" />
                            <Typography variant="subtitle2" fontWeight="bold">Estatísticas</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={4}>
                                <PaperVariant label="Equipe Presente" value={report.teamMembersPresent} />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <PaperVariant label="Acolhidos Ouviram" value={report.shelteredHeardMessage} />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <PaperVariant label="Cuidadores Ouviram" value={report.caretakersHeardMessage} />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <PaperVariant label="Decisões (Acolhidos)" value={report.shelteredDecisions} />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <PaperVariant label="Decisões (Cuidadores)" value={report.caretakersDecisions} />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <PaperVariant label="Total Decisões" value={(report.shelteredDecisions || 0) + (report.caretakersDecisions || 0)} highlight />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>



                    {report.observation && (
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <DescriptionIcon color="warning" />
                                <Typography variant="subtitle2" fontWeight="bold">Observações da Visita</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', bgcolor: 'warning.lighter', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'warning.light', maxHeight: 200, overflowY: 'auto' }}>
                                {report.observation}
                            </Typography>
                        </Grid>
                    )}


                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function PaperVariant({ label, value, highlight = false }: { label: string; value: number | undefined; highlight?: boolean }) {
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: highlight ? "primary.light" : "background.paper",
                color: highlight ? "primary.contrastText" : "text.primary",
                boxShadow: 1,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}
        >
            <Typography variant="caption" sx={{ opacity: 0.8, mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
                {value ?? 0}
            </Typography>
        </Box>
    );
}
