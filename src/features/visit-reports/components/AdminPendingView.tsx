import React, { useState, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Grid,
    IconButton,
    Paper,
    Stack,
    TextField,
    Typography,
    InputAdornment,
    Divider,
    useTheme,
    alpha
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Home as HomeIcon,
    Description as DescriptionIcon,
    Groups as GroupsIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    AssignmentLate as PendingIcon
} from '@mui/icons-material';
import { TeamVisitReportPendingsDto } from '../../attendance/types';

interface AdminPendingViewProps {
    pendings: TeamVisitReportPendingsDto[];
    onNavigate: () => void;
}

export const AdminPendingView: React.FC<AdminPendingViewProps> = ({ pendings, onNavigate }) => {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedShelter, setExpandedShelter] = useState<string | null>(null);
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);


    const filteredPendings = useMemo(() => {
        if (!searchTerm) return pendings;
        const term = searchTerm.toLowerCase();
        return pendings.filter(p =>
            p.shelterName.toLowerCase().includes(term) ||
            p.teamName.toLowerCase().includes(term)
        );
    }, [pendings, searchTerm]);



    const groupedReportsByShelter = useMemo(() => {
        return filteredPendings.reduce((acc: Record<string, TeamVisitReportPendingsDto[]>, team) => {
            if (!acc[team.shelterName]) {
                acc[team.shelterName] = [];
            }
            acc[team.shelterName].push(team);
            return acc;
        }, {} as Record<string, TeamVisitReportPendingsDto[]>);
    }, [filteredPendings]);

    const sortedReportShelters = Object.entries(groupedReportsByShelter).sort((a, b) =>
        a[0].localeCompare(b[0])
    );

    const toggleShelter = (shelterName: string) => {
        setExpandedShelter(prev => (prev === shelterName ? null : shelterName));
        setExpandedTeam(null);
    };

    const toggleTeam = (teamId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedTeam(prev => (prev === teamId ? null : teamId));
    };



    const totalShelters = Object.keys(groupedReportsByShelter).length;
    const totalPendings = filteredPendings.reduce((acc, t) => acc + t.pendings.length, 0);

    return (
        <Stack spacing={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                            {totalPendings}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            PENDENTES
                        </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center', px: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            {totalShelters}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            ABRIGOS
                        </Typography>
                    </Box>
                </Box>

                <TextField
                    placeholder="Filtrar por abrigo ou equipe..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', md: 350 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: 2 }
                    }}
                />
            </Paper>

            {sortedReportShelters.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">Nenhum resultado encontrado para o filtro.</Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {sortedReportShelters.map(([shelterName, teams]) => {
                        const isShelterExpanded = expandedShelter === shelterName;
                        const shelterPendingsCount = teams.reduce((acc, t) => acc + t.pendings.length, 0);

                        return (
                            <Grid item xs={12} key={shelterName}>
                                <Card variant="outlined" sx={{
                                    borderRadius: 3,
                                    borderColor: isShelterExpanded ? 'primary.main' : 'divider',
                                    transition: 'all 0.2s',
                                    bgcolor: 'white',
                                    boxShadow: isShelterExpanded ? theme.shadows[4] : 'none'
                                }}>
                                    <CardContent
                                        sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onClick={() => toggleShelter(shelterName)}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={2} sx={{ overflow: 'hidden' }}>
                                            <Box sx={{
                                                bgcolor: isShelterExpanded ? 'primary.main' : 'primary.light',
                                                p: 1.5,
                                                borderRadius: 2.5,
                                                display: 'flex',
                                                color: isShelterExpanded ? 'white' : 'primary.contrastText',
                                                transition: 'all 0.2s',
                                                flexShrink: 0
                                            }}>
                                                <HomeIcon />
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="h6" fontWeight="bold" noWrap>
                                                    {shelterName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {teams.length} {teams.length === 1 ? 'equipe' : 'equipes'} com pendências
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, ml: 1 }}>
                                            <Chip
                                                label={`${shelterPendingsCount} pendentes`}
                                                size="small"
                                                color={shelterPendingsCount > 0 ? "error" : "default"}
                                                sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                                            />
                                            <IconButton size="small" sx={{
                                                transform: isShelterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s'
                                            }}>
                                                <ExpandMoreIcon />
                                            </IconButton>
                                        </Stack>
                                    </CardContent>

                                    <Collapse in={isShelterExpanded}>
                                        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Grid container spacing={2}>
                                                {teams.map((team) => {
                                                    const isTeamExpanded = expandedTeam === team.teamId;
                                                    return (
                                                        <Grid item xs={12} key={team.teamId}>
                                                            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                                                                <Box
                                                                    onClick={(e) => toggleTeam(team.teamId, e)}
                                                                    sx={{
                                                                        p: 2,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        cursor: 'pointer',
                                                                        bgcolor: 'white',
                                                                        '&:hover': { bgcolor: 'grey.50' }
                                                                    }}
                                                                >
                                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                        <GroupsIcon color="action" fontSize="small" />
                                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                                            {team.teamName}
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                                        <Chip
                                                                            label={team.pendings.length}
                                                                            size="small"
                                                                            color="warning"
                                                                            sx={{ height: 24, minWidth: 24, fontSize: '0.75rem', fontWeight: 'bold' }}
                                                                        />
                                                                        <IconButton size="small">
                                                                            {isTeamExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                                        </IconButton>
                                                                    </Stack>
                                                                </Box>

                                                                <Collapse in={isTeamExpanded}>
                                                                    <Divider />
                                                                    <Stack spacing={0} divider={<Divider />}>
                                                                        {team.pendings.map((pending, idx) => (
                                                                            <Box key={idx} sx={{ p: 2, bgcolor: 'white', '&:hover': { bgcolor: 'info.lighter' } }}>
                                                                                <Stack
                                                                                    direction={{ xs: "column", sm: "row" }}
                                                                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                                                                    spacing={2}
                                                                                    justifyContent="space-between"
                                                                                >
                                                                                    <Stack spacing={0.5} sx={{ minWidth: 0, width: '100%' }}>
                                                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                                                            <Chip label={`Visita #${pending.visitNumber}`} size="small" variant="outlined" color="primary" sx={{ fontWeight: 'bold' }} />
                                                                                            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                                                                                {new Date(pending.visitDate).toLocaleDateString('pt-BR')}
                                                                                            </Typography>
                                                                                        </Stack>

                                                                                        <Typography variant="body1" fontWeight="medium" noWrap sx={{ py: 0.5 }}>
                                                                                            {pending.lessonContent}
                                                                                        </Typography>

                                                                                        {pending.observation && (
                                                                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                                                                <PendingIcon color="warning" fontSize="small" sx={{ fontSize: 16 }} />
                                                                                                <Typography variant="caption" color="warning.dark" fontWeight="bold">
                                                                                                    {pending.observation}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        )}
                                                                                    </Stack>

                                                                                    <Button
                                                                                        variant="contained"
                                                                                        size="small"
                                                                                        startIcon={<DescriptionIcon />}
                                                                                        onClick={onNavigate}
                                                                                        sx={{
                                                                                            flexShrink: 0,
                                                                                            mt: { xs: 1, sm: 0 },
                                                                                            alignSelf: { xs: 'flex-start', sm: 'center' },
                                                                                            textTransform: 'none',
                                                                                            borderRadius: 2
                                                                                        }}
                                                                                    >
                                                                                        Criar Relatório
                                                                                    </Button>
                                                                                </Stack>
                                                                            </Box>
                                                                        ))}
                                                                    </Stack>
                                                                </Collapse>
                                                            </Paper>
                                                        </Grid>
                                                    );
                                                })}
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Stack>
    );
};
