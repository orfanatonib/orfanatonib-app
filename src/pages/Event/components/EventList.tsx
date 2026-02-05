import React, { Dispatch, SetStateAction } from 'react';
import { Box, Paper, Grid, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import { motion } from 'framer-motion';
import { gradients } from '@/theme';
import EventCard from './EventCard';

interface EventListProps {
    arrangement: any;
    isAdmin: boolean;
    mostrarAntigos: boolean;
    setMostrarAntigos: Dispatch<SetStateAction<boolean>>;
    eventosAntigosRef: React.RefObject<HTMLDivElement | null>;
    onViewDetails: (event: any) => void;
    onEdit: (event: any) => void;
    onDelete: (event: any) => void;
}

const EventList: React.FC<EventListProps> = ({
    arrangement,
    isAdmin,
    mostrarAntigos,
    setMostrarAntigos,
    eventosAntigosRef,
    onViewDetails,
    onEdit,
    onDelete
}) => {
    const renderEvent = (event: any, slotType?: string) => (
        <EventCard
            event={event}
            slotType={slotType}
            isAdmin={isAdmin}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );

    return (
        <Box sx={{ width: '100%', mb: 6 }}>
            {arrangement.temHoje ? (
                <Box sx={{ width: '100%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            duration: 0.8,
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                        }}
                        style={{ width: '100%', maxWidth: '800px', margin: '0 auto', marginBottom: '2rem' }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                borderRadius: 4,
                                overflow: 'hidden',
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.98)',
                                border: '2px solid rgba(239, 68, 68, 0.3)',
                                boxShadow: '0 24px 48px rgba(239, 68, 68, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    boxShadow: '0 32px 64px rgba(239, 68, 68, 0.25), 0 16px 32px rgba(0, 0, 0, 0.2)',
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 6,
                                    background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                                    zIndex: 2,
                                }}
                            />

                            <Box sx={{ p: 0 }}>
                                {renderEvent(arrangement.eventoHoje, 'hoje')}
                            </Box>
                        </Paper>
                    </motion.div>

                    {(arrangement.proximoEvento || arrangement.eventoAnterior) && (
                        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ justifyContent: 'center' }}>
                            {arrangement.proximoEvento && (
                                <Grid item xs={12} md={6}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: 0.3,
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 15
                                        }}
                                        style={{ width: '100%' }}
                                    >
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                position: 'relative',
                                                background: 'rgba(255, 255, 255, 0.98)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                boxShadow: '0 16px 32px rgba(59, 130, 246, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15)',
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: 4,
                                                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                                    zIndex: 2,
                                                }}
                                            />

                                            <Box sx={{ p: 0 }}>
                                                {renderEvent(arrangement.proximoEvento, 'proximo')}
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                </Grid>
                            )}

                            {arrangement.eventoAnterior && (
                                <Grid item xs={12} md={6}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: 0.4,
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 15
                                        }}
                                        style={{ width: '100%' }}
                                    >
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: 4,
                                                overflow: 'hidden',
                                                position: 'relative',
                                                background: 'rgba(255, 255, 255, 0.98)',
                                                border: '1px solid rgba(156, 163, 175, 0.3)',
                                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
                                                },
                                            }}
                                        >
                                            <Box sx={{ p: 0 }}>
                                                {renderEvent(arrangement.eventoAnterior, 'anterior')}
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Box>
            ) : (
                <Grid container spacing={{ xs: 2, md: 3 }} sx={{ justifyContent: 'center' }}>
                    {arrangement.proximoEvento && (
                        <Grid item xs={12} md={6}>
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: 0.1,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 15
                                }}
                                style={{ width: '100%' }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        boxShadow: '0 16px 32px rgba(59, 130, 246, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: 4,
                                            background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                            zIndex: 2,
                                        }}
                                    />

                                    <Box sx={{ p: 0 }}>
                                        {renderEvent(arrangement.proximoEvento, 'proximo')}
                                    </Box>
                                </Paper>
                            </motion.div>
                        </Grid>
                    )}

                    {arrangement.eventoAnterior && (
                        <Grid item xs={12} md={6}>
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: 0.2,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 15
                                }}
                                style={{ width: '100%' }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        border: '1px solid rgba(156, 163, 175, 0.3)',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
                                        },
                                    }}
                                >
                                    <Box sx={{ p: 0 }}>
                                        {renderEvent(arrangement.eventoAnterior, 'anterior')}
                                    </Box>
                                </Paper>
                            </motion.div>
                        </Grid>
                    )}
                </Grid>
            )}

            {(arrangement.eventosRestantes.length > 0 || arrangement.segundoFuturo || arrangement.terceiroFuturo) && (
                <Accordion
                    defaultExpanded
                    sx={{
                        mt: 4,
                        mb: 4,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(16, 185, 129, 0.2)',
                        '&:before': { display: 'none' },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                            '& .MuiAccordionSummary-content': {
                                alignItems: 'center',
                                gap: 2,
                            },
                        }}
                    >
                        <CalendarTodayIcon sx={{ color: '#10b981' }} />
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ color: '#065f46', fontSize: { xs: '0.9rem', md: '1.25rem' } }}
                        >
                            Mais Eventos Futuros ({arrangement.eventosRestantes.length + (arrangement.segundoFuturo ? 1 : 0) + (arrangement.terceiroFuturo ? 1 : 0)})
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 4 }}>
                        <Grid container spacing={{ xs: 3, md: 4 }}>
                            {arrangement.segundoFuturo && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0 }}
                                    >
                                        {renderEvent(arrangement.segundoFuturo)}
                                    </motion.div>
                                </Grid>
                            )}

                            {arrangement.terceiroFuturo && (
                                <Grid item xs={12} sm={6} md={4}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                    >
                                        {renderEvent(arrangement.terceiroFuturo)}
                                    </motion.div>
                                </Grid>
                            )}

                            {arrangement.eventosRestantes.map((evento: any, index: number) => (
                                <Grid item xs={12} sm={6} md={4} key={evento.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: (index + 2) * 0.1 }}
                                    >
                                        {renderEvent(evento)}
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}

            {!arrangement.temFuturo && arrangement.eventosRestantes.length === 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(156, 163, 175, 0.2)',
                        mb: 4,
                        textAlign: 'center',
                    }}
                >
                    <EventIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom>
                        Nenhum Evento Futuro
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Não há eventos programados para o futuro no momento.
                    </Typography>
                </Paper>
            )}

            {arrangement.eventosAntigosRestantes.length > 0 && (
                <Accordion
                    ref={eventosAntigosRef}
                    expanded={mostrarAntigos}
                    onChange={(_, expanded) => setMostrarAntigos(expanded)}
                    sx={{
                        mb: 4,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '&:before': { display: 'none' },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            background: gradients.subtle.greenWhiteSoft,
                            '& .MuiAccordionSummary-content': {
                                alignItems: 'center',
                                gap: 2,
                            },
                        }}
                    >
                        <EventIcon color="action" />
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ color: '#1f2937', fontSize: { xs: '0.9rem', md: '1.25rem' } }}
                        >
                            Eventos Anteriores ({arrangement.eventosAntigosRestantes.length})
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 4 }}>
                        <Grid container spacing={{ xs: 3, md: 4 }}>
                            {arrangement.eventosAntigosRestantes.map((evento: any, index: number) => (
                                <Grid item xs={12} sm={6} md={4} key={evento.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        {renderEvent(evento)}
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}
        </Box>
    );
};

export default EventList;
