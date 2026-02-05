import React, { useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Stack,
    Typography,
    Alert,
    useTheme,
    alpha,
    Paper
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Groups as GroupsIcon,
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    Home as HomeIcon
} from '@mui/icons-material';
import { TeamVisitReportPendingsDto } from '../../attendance/types';

interface LeaderPendingViewProps {
    pendings: TeamVisitReportPendingsDto[];
    onNavigate: () => void;
}

export const LeaderPendingView: React.FC<LeaderPendingViewProps> = ({ pendings, onNavigate }) => {
    const theme = useTheme();

    const groupedByShelter = useMemo(() => {
        return pendings.reduce((acc: Record<string, TeamVisitReportPendingsDto[]>, team) => {
            if (!acc[team.shelterName]) {
                acc[team.shelterName] = [];
            }
            acc[team.shelterName].push(team);
            return acc;
        }, {} as Record<string, TeamVisitReportPendingsDto[]>);
    }, [pendings]);

    const sortedShelters = Object.entries(groupedByShelter).sort((a, b) =>
        a[0].localeCompare(b[0])
    );

    return (
        <Stack spacing={4}>
            {sortedShelters.map(([shelterName, teams]) => (
                <Paper key={shelterName} elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>

                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            p: 1,
                            borderRadius: 2,
                            display: 'flex'
                        }}>
                            <HomeIcon fontSize="medium" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                {shelterName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {teams.reduce((acc, t) => acc + t.pendings.length, 0)} relatórios pendentes neste abrigo
                            </Typography>
                        </Box>
                    </Box>

                    <Stack spacing={4}>
                        {teams.map(team => (
                            <Box key={team.teamId}>
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                    <GroupsIcon color="action" fontSize="small" />
                                    <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                                        {team.teamName}
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    {team.pendings.map((pending, idx) => (
                                        <Grid item xs={12} sm={6} md={4} key={`${team.teamId}-${idx}`}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 3,
                                                    bgcolor: 'white',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: theme.shadows[4],
                                                        borderColor: 'primary.main'
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    p: 2,
                                                    borderBottom: '1px solid',
                                                    borderColor: 'divider',
                                                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <Chip
                                                        label={`Visita #${pending.visitNumber}`}
                                                        size="small"
                                                        color="warning"
                                                        sx={{ fontWeight: 'bold' }}
                                                    />
                                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                                                        <CalendarIcon fontSize="inherit" />
                                                        {new Date(pending.visitDate).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                </Box>

                                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            Conteúdo da Lição
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
                                                            {pending.lessonContent}
                                                        </Typography>
                                                    </Box>

                                                    {pending.shelterAddress && (
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                            <LocationIcon color="action" fontSize="small" />
                                                            <Typography variant="body2" color="text.secondary">
                                                                {pending.shelterAddress}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {pending.observation && (
                                                        <Alert
                                                            severity="warning"
                                                            icon={false}
                                                            sx={{
                                                                mt: 'auto',
                                                                py: 0.5,
                                                                borderRadius: 2,
                                                                border: '1px solid',
                                                                borderColor: 'warning.light'
                                                            }}
                                                        >
                                                            <Typography variant="caption" color="warning.dark" fontWeight="bold">
                                                                Obs: {pending.observation}
                                                            </Typography>
                                                        </Alert>
                                                    )}
                                                </CardContent>

                                                <Box sx={{ p: 2, pt: 0 }}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        size="large"
                                                        startIcon={<DescriptionIcon />}
                                                        onClick={onNavigate}
                                                        sx={{
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 'bold',
                                                            boxShadow: 'none',
                                                            '&:hover': {
                                                                boxShadow: theme.shadows[4]
                                                            }
                                                        }}
                                                    >
                                                        Preencher Relatório
                                                    </Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
};
