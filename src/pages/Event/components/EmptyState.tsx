import React from 'react';
import { Paper, Typography, Button } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    isAdmin: boolean;
    onAddEvent: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isAdmin, onAddEvent }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
            >
                <EventIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3, opacity: 0.6 }} />
                <Typography
                    variant="h4"
                    fontWeight={600}
                    color="text.secondary"
                    gutterBottom
                    sx={{ mb: 2 }}
                >
                    Nenhum evento encontrado
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4, opacity: 0.8 }}
                >
                    Não há eventos cadastrados no momento. Volte em breve!
                </Typography>
                {isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onAddEvent}
                        size="large"
                        sx={{
                            borderRadius: 3,
                            py: { xs: 1, md: 1.5 },
                            px: { xs: 2, md: 4 },
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: { xs: '0.8rem', md: '1.1rem' },
                            backgroundColor: '#009933',
                            color: '#FFFFFF',
                            '&:hover': {
                                backgroundColor: '#007a29',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        Adicionar Primeiro Evento
                    </Button>
                )}
            </Paper>
        </motion.div>
    );
};

export default EmptyState;
