import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Shield as ShieldIcon } from '@mui/icons-material';

const SafetyGoldenRule: React.FC = () => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 4, md: 6 },
                bgcolor: '#ffffff',
                borderRadius: 8,
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 30px 70px rgba(225, 29, 72, 0.08)',
                    borderColor: '#e11d48'
                }
            }}
        >
            <Box sx={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.03,
                zIndex: 0,
                color: '#e11d48'
            }}>
                <ShieldIcon sx={{ fontSize: 200 }} />
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <ShieldIcon sx={{ fontSize: 70, color: '#e11d48', mb: 2 }} />
                <Typography variant="h4" fontWeight="900" sx={{ color: '#e11d48', mb: 1, letterSpacing: '-0.02em' }}>
                    Regra de Ouro
                </Typography>
                <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 300, mb: 3 }}>
                    Homem conversa com homem. <Box component="span" sx={{ fontWeight: 800, color: '#e11d48' }}>Mulher conversa com mulher.</Box>
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', maxWidth: 600, mx: 'auto', fontWeight: 500 }}>
                    Esta regra protege a todos: às crianças, aos membros e ao ministério.
                </Typography>
            </Box>
        </Paper>
    );
};

export default SafetyGoldenRule;
