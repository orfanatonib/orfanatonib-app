import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PrioritiesIntro: React.FC = () => {
    return (
        <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
                p: { xs: 4, md: 5 },
                maxWidth: 800,
                mx: 'auto',
                background: '#ffffff',
                borderRadius: 6,
                border: '2px solid #ef4444',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    opacity: 0.1,
                    transform: 'rotate(15deg)'
                }}>
                    <Typography variant="h1" fontWeight="900" sx={{ color: '#ef4444' }}>⚠️</Typography>
                </Box>

                <Typography variant="h4" fontWeight="900" sx={{ color: '#ef4444', mb: 2, letterSpacing: '-0.02em' }}>
                    O Princípio de Prioridade
                </Typography>
                <Typography variant="h6" sx={{ color: '#450a0a', fontWeight: 600, mb: 3, lineHeight: 1.4 }}>
                    "Se tiver que optar, escolha sempre o Culto. O Ministério exige organização, não é 'quando der'."
                </Typography>
                <Box sx={{ display: 'inline-block', py: 1, px: 3, bgcolor: '#ef4444', borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight="900" color="white" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Conflito de Horário? Vá ao Culto!
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default PrioritiesIntro;
