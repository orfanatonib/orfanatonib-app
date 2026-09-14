import React from 'react';
import { Link } from 'react-router-dom';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    CircularProgress,
    TextField,
    IconButton,
    Paper,
    useTheme,
    useMediaQuery,
    Container,
    Tabs,
    Tab,
    InputAdornment,
    Chip,
    Alert,
} from '@mui/material';
import { ArrowBack, Search, Clear, FilterList } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVisitMaterials } from '@/features/visit-materials/hooks';
import {
    VISIT_MATERIAL_TAB_LABELS,
    VISIT_MATERIAL_TAB_MOBILE_LABELS,
    VISIT_MATERIAL_TESTAMENT_LABELS,
} from '@/features/visit-materials/constants';
import {
    TestamentType,
    VisitMaterialListTab,
} from '@/features/visit-materials/types';
import { tabFromTestament, testamentFromTab } from '@/features/visit-materials/utils';
import { FofinhoButton } from '../Buttons';

const VisitMaterialsList = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const {
        materials: allMaterials,
        search: filter,
        setSearch: setFilter,
        testament,
        setTestament,
        loading,
        isFiltering,
        error,
    } = useVisitMaterials();
    const materials = allMaterials.filter((material) => material.route.public);
    const activeTab = tabFromTestament(testament);

    const handleTabChange = (
        _: React.SyntheticEvent,
        newValue: VisitMaterialListTab,
    ) => setTestament(testamentFromTab(newValue));

    if (loading && materials.length === 0) {
        return (
            <Box
                data-testid="visit-material-member-list-loading"
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    const handleBack = () => {
        navigate('/area-do-membro');
    };

    return (
        <Box
            data-testid="visit-material-member-list"
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                py: { xs: 2, md: 4 },
            }}
        >
            <Container maxWidth="xl">
                <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                    <IconButton
                        data-testid="visit-material-member-list-back"
                        aria-label="Voltar para a área do membro"
                        onClick={handleBack}
                        sx={{
                            bgcolor: 'background.paper',
                            boxShadow: 2,
                            '&:hover': {
                                bgcolor: 'action.hover',
                                transform: 'scale(1.05)',
                            },
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                        📚 Materiais de Visita
                    </Typography>
                </Box>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Paper
                        elevation={2}
                        sx={{
                            p: { xs: 3, md: 4 },
                            mb: 4,
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                data-testid="visit-material-member-list-search"
                                label="Buscar materiais"
                                fullWidth
                                placeholder="Buscar materiais por título, subtítulo ou descrição..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: filter && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                data-testid="visit-material-member-list-clear-search"
                                                aria-label="Limpar busca"
                                                size="small"
                                                onClick={() => setFilter('')}
                                            >
                                                <Clear fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        bgcolor: 'background.paper',
                                        '&:hover': {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'primary.main',
                                            },
                                        },
                                        '&.Mui-focused': {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderWidth: 2,
                                            },
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ position: 'relative' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 2,
                                }}
                            >
                                <FilterList sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Filtrar por Testamento:
                                </Typography>
                            </Box>
                            <Tabs
                                data-testid="visit-material-member-list-tabs"
                                value={activeTab}
                                onChange={handleTabChange}
                                variant={isMobile ? 'scrollable' : 'standard'}
                                scrollButtons="auto"
                                sx={{
                                    '& .MuiTabs-indicator': {
                                        height: 3,
                                        borderRadius: '3px 3px 0 0',
                                    },
                                    '& .MuiTab-root': {
                                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        minHeight: { xs: 48, md: 56 },
                                        px: { xs: 1.5, sm: 2, md: 3 },
                                        '&.Mui-selected': {
                                            color: 'primary.main',
                                        },
                                    },
                                }}
                            >
                                {Object.values(VisitMaterialListTab).map((tabValue) => (
                                    <Tab
                                        key={tabValue}
                                        label={
                                            isMobile
                                                ? VISIT_MATERIAL_TAB_MOBILE_LABELS[tabValue]
                                                : VISIT_MATERIAL_TAB_LABELS[tabValue]
                                        }
                                        value={tabValue}
                                    />
                                ))}
                            </Tabs>
                        </Box>
                    </Paper>
                </motion.div>

                {error && (
                    <Alert
                        data-testid="visit-material-member-list-error"
                        severity="error"
                        sx={{ mb: 3 }}
                    >
                        {error}
                    </Alert>
                )}

                {(loading || isFiltering) && materials.length > 0 && (
                    <Box
                        data-testid="visit-material-member-list-filtering"
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 2,
                        }}
                    >
                        <CircularProgress size={32} />
                    </Box>
                )}

                {materials.length === 0 && !loading && !isFiltering && !error ? (
                    <Paper
                        data-testid="visit-material-member-list-empty"
                        elevation={1}
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Typography variant="h5" color="text.secondary" gutterBottom>
                            📭 Nenhum material encontrado
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {filter
                                ? 'Tente ajustar sua busca ou limpar os filtros.'
                                : activeTab !== 'ALL'
                                ? `Nenhum material do ${activeTab === VisitMaterialListTab.OLD_TESTAMENT ? 'Antigo' : 'Novo'} Testamento encontrado.`
                                : 'Ainda não há materiais disponíveis.'}
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {materials.map((material, index) => {
                            return (
                                <Grid
                                    item
                                    key={material.id}
                                    component={motion.div}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    xs={12}
                                    sm={6}
                                    md={4}
                                    lg={3}
                                >
                                    <Card
                                        data-testid="visit-material-member-card"
                                        data-material-id={material.id}
                                        component={motion.div}
                                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 4,
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                                                borderColor: 'primary.main',
                                            },
                                        }}
                                    >
                        {material.testament && (
                            <Box
                                sx={{
                                    p: { xs: 1.5, sm: 2 },
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.default',
                                }}
                            >
                                <Chip
                                    label={
                                        isMobile
                                            ? material.testament === TestamentType.OLD_TESTAMENT
                                                ? '📖 AT'
                                                : '✝️ NT'
                                            : VISIT_MATERIAL_TESTAMENT_LABELS[material.testament]
                                    }
                                    size="small"
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                        height: { xs: 24, sm: 28 },
                                    }}
                                />
                            </Box>
                        )}

                        <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column' }}>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                gutterBottom
                                sx={{
                                    fontSize: { xs: '1rem', sm: '1.25rem' },
                                    lineHeight: 1.3,
                                    mb: 1,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {material.title}
                            </Typography>

                                            {material.subtitle && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        mb: 1.5,
                                                        fontWeight: 500,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {material.subtitle}
                                                </Typography>
                                            )}

                                            {material.description && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        flex: 1,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        lineHeight: 1.6,
                                                        mb: 2,
                                                    }}
                                                >
                                                    {material.description}
                                                </Typography>
                                            )}
                                        </CardContent>

                                        <Box sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
                                            <Button
                                                data-testid="visit-material-member-card-open"
                                                variant="contained"
                                                component={Link}
                                                to={`/${material.route?.path}`}
                                                fullWidth
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    py: { xs: 1, sm: 1.25 },
                                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: 4,
                                                    },
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                📖 Ver Material
                                            </Button>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

export default VisitMaterialsList;
