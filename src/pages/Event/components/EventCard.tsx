import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    IconButton,
    Tooltip,
    Stack,
    Chip,
    useTheme
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { getEventStatus } from '../utils/eventUtils';
import { getEstiloCard, getChipProps } from '../utils/styleUtils';

const fallbackImageUrl = import.meta.env.VITE_SHELTER_FALLBACK_IMAGE_URL;

interface EventCardProps {
    event: any;
    slotType?: string;
    isAdmin: boolean;
    onViewDetails: (event: any) => void;
    onEdit: (event: any) => void;
    onDelete: (event: any) => void;
}

const EventCard: React.FC<EventCardProps> = ({
    event,
    slotType,
    isAdmin,
    onViewDetails,
    onEdit,
    onDelete
}) => {
    const theme = useTheme();
    const status = getEventStatus(event.date);
    const estilo = getEstiloCard(status, theme);
    const chipProps = getChipProps(status, slotType);
    const dataFormatada = dayjs(event.date).format('DD [de] MMMM');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
        >
            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    ...estilo,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    },
                }}
            >
                <CardContent sx={{ p: 0 }}>
                    <Box
                        sx={{
                            height: { xs: 240, md: 320 },
                            backgroundImage: event.media?.url ? `url(${event.media.url})` : `url('${fallbackImageUrl}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: '#000000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            borderRadius: '16px 16px 0 0',
                            overflow: 'hidden',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                            <Chip
                                {...chipProps}
                                size="small"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    backdropFilter: 'blur(10px)',
                                    backgroundColor: chipProps.variant === 'filled' ? undefined : 'rgba(255, 255, 255, 0.9)',
                                }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                fontSize: { xs: '0.9rem', md: '1.25rem' },
                                mb: 2,
                                lineHeight: 1.3,
                                color: '#000000',
                            }}
                        >
                            {event.title}
                        </Typography>

                        <Stack spacing={1.5}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Box
                                    sx={{
                                        p: 0.75,
                                        borderRadius: 2,
                                        bgcolor: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <CalendarTodayIcon fontSize="small" sx={{ color: '#333333' }} />
                                </Box>
                                <Typography variant="body2" sx={{ color: '#333333', fontWeight: 500, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                    {dataFormatada}
                                </Typography>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Box
                                    sx={{
                                        p: 0.75,
                                        borderRadius: 2,
                                        bgcolor: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <PlaceIcon fontSize="small" sx={{ color: '#333333' }} />
                                </Box>
                                <Typography variant="body2" sx={{ color: '#333333', fontWeight: 500, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                    {event.location}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </CardContent>

                <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                    {!isAdmin ? (
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => onViewDetails(event)}
                            sx={{
                                borderRadius: 3,
                                py: { xs: 1, md: 1.5 },
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: { xs: '0.75rem', md: '0.95rem' },
                                backgroundColor: '#009933',
                                color: '#FFFFFF',
                                '&:hover': {
                                    backgroundColor: '#007a29',
                                    transform: 'translateY(-1px)',
                                },
                            }}
                        >
                            Ver Detalhes
                        </Button>
                    ) : (
                        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Editar">
                                    <IconButton
                                        onClick={() => onEdit(event)}
                                        size="small"
                                        sx={{
                                            bgcolor: '#f0f9ff',
                                            color: '#0ea5e9',
                                            '&:hover': { bgcolor: '#e0f2fe' },
                                            width: { xs: 32, md: 40 },
                                            height: { xs: 32, md: 40 },
                                        }}
                                    >
                                        <EditIcon sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                    <IconButton
                                        onClick={() => onDelete(event)}
                                        size="small"
                                        sx={{
                                            bgcolor: '#fef2f2',
                                            color: '#ef4444',
                                            '&:hover': { bgcolor: '#fee2e2' },
                                            width: { xs: 32, md: 40 },
                                            height: { xs: 32, md: 40 },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => onViewDetails(event)}
                                sx={{
                                    borderRadius: 3,
                                    py: { xs: 1, md: 1.5 },
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontSize: { xs: '0.75rem', md: '0.95rem' },
                                    backgroundColor: '#009933',
                                    color: '#FFFFFF',
                                    '&:hover': {
                                        backgroundColor: '#007a29',
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                Ver Detalhes
                            </Button>
                        </Stack>
                    )}
                </CardActions>
            </Card>
        </motion.div>
    );
};

export default EventCard;
