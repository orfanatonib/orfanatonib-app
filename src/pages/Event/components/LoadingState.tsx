import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { motion } from 'framer-motion';

const LoadingState: React.FC = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #ffffff 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Paper
                    elevation={8}
                    sx={{
                        p: 6,
                        borderRadius: 4,
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <EventIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                        Carregando Eventos
                    </Typography>
                    <CircularProgress size={40} />
                </Paper>
            </motion.div>
        </Box>
    );
};

export default LoadingState;
