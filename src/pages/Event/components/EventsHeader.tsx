import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import { motion } from 'framer-motion';

interface EventsHeaderProps {
    isAdmin: boolean;
    onAddEvent: () => void;
}

const EventsHeader: React.FC<EventsHeaderProps> = ({ isAdmin, onAddEvent }) => {
    return (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'center', md: 'flex-start' },
                        gap: { xs: 3, md: 0 },
                        mb: 4,
                    }}
                >
                    <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Typography
                            variant="h3"
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: '1.3rem', md: '2.5rem' },
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: { xs: 'center', md: 'flex-start' },
                                gap: 2,
                                color: '#000000',
                            }}
                        >
                            <EventIcon sx={{ fontSize: { xs: 24, md: 40 } }} />
                            Eventos do Ministério de Ofanato
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#333333',
                                fontSize: { xs: '0.8rem', md: '1.1rem' },
                                fontWeight: 400,
                            }}
                        >
                            Participe das atividades e encontros do Ministério de Ofanato!
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 2,
                            alignItems: 'center',
                        }}
                    >
                        {isAdmin && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={onAddEvent}
                                sx={{
                                    borderRadius: 3,
                                    py: { xs: 1, md: 1.5 },
                                    px: { xs: 2, md: 3 },
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontSize: { xs: '0.8rem', md: '1rem' },
                                    backgroundColor: '#009933',
                                    color: '#FFFFFF',
                                    '&:hover': {
                                        backgroundColor: '#007a29',
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Adicionar Evento
                            </Button>
                        )}
                    </Box>
                </Box>
            </motion.div>
        </Container>
    );
};

export default EventsHeader;
