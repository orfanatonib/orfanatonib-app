import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box,
    Breadcrumbs,
    Chip,
    CircularProgress,
    Link,
    Stack,
    Typography,
    Alert,
    Button,
    Container,
    Paper,
    useTheme
} from '@mui/material';
import {
    Description as DescriptionIcon,
    ArrowBack as ArrowBackIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';

import { useAttendancePendings } from '../../attendance/hooks/useAttendancePendings';
import { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';
import { LeaderPendingView } from '../components/LeaderPendingView';
import { AdminPendingView } from '../components/AdminPendingView';

const PendingVisitReportsPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { visitReportPendings, visitReportPendingsCount, loading, error } = useAttendancePendings();
    const { user } = useSelector((state: RootState) => state.auth);

    const isLeader = user?.role === UserRole.LEADER;
    const isAdmin = user?.role === UserRole.ADMIN;

    const handleNavigateToCreateReport = () => {
        navigate('/adm/relatorios-visita');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ p: { xs: 2, md: 4 } }}>
            {/* Header Section */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/adm')}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                    Voltar
                </Button>
                <Breadcrumbs sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/adm')} sx={{ cursor: 'pointer' }}>
                        Admin
                    </Link>
                    <Link underline="hover" color="inherit" onClick={() => navigate('/adm/relatorios-visita')} sx={{ cursor: 'pointer' }}>
                        Relatórios
                    </Link>
                    <Typography color="text.primary">Pendências</Typography>
                </Breadcrumbs>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" sx={{ mb: 4, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mb: 1, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                        Relatórios Pendentes
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {isLeader
                            ? "Confira abaixo os relatórios que você precisa preencher."
                            : "Gerencie os relatórios de visita que ainda precisam ser enviados pelas equipes."}
                    </Typography>
                </Box>
                {visitReportPendingsCount > 0 && (
                    <Chip
                        icon={<AssignmentIcon sx={{ color: 'inherit !important' }} />}
                        label={`${visitReportPendingsCount} pendentes`}
                        color="warning"
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            py: 2.5,
                            pl: 1,
                            borderRadius: 3,
                            width: { xs: '100%', md: 'auto' },
                            boxShadow: theme.shadows[2]
                        }}
                    />
                )}
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error?.message || 'Erro ao carregar pendências.'}
                </Alert>
            )}

            {visitReportPendingsCount === 0 ? (
                <Paper variant="outlined" sx={{ textAlign: 'center', py: 8, borderRadius: 4, borderStyle: 'dashed', bgcolor: 'background.default' }}>
                    <DescriptionIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Tudo em dia!
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        Não há relatórios pendentes no momento.
                    </Typography>
                </Paper>
            ) : (
                <Box>
                    {isLeader && <LeaderPendingView pendings={visitReportPendings} onNavigate={handleNavigateToCreateReport} />}
                    {isAdmin && <AdminPendingView pendings={visitReportPendings} onNavigate={handleNavigateToCreateReport} />}
                </Box>
            )}
        </Container>
    );
};

export default PendingVisitReportsPage;
