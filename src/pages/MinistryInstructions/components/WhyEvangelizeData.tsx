import React from 'react';
import { Paper, Typography, Grid, Box, List, ListItem } from '@mui/material';

const WhyEvangelizeData: React.FC = () => {
    return (
        <Box sx={{
            p: { xs: 4, md: 6 },
            bgcolor: '#ffffff',
            borderRadius: 8,
            mb: 4,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.05)',
            transition: 'all 0.4s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 30px 60px rgba(15, 23, 42, 0.08)'
            }
        }}>
            <Typography variant="h5" fontWeight="900" gutterBottom sx={{ color: '#e11d48', letterSpacing: '-0.02em', mb: 4 }}>
                📊 O que os dados revelam:
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                    <Box sx={{
                        p: 3,
                        bgcolor: '#ffffff',
                        borderRadius: 4,
                        border: '1px solid #e2e8f0'
                    }}>
                        <Typography variant="h6" fontWeight="800" gutterBottom sx={{ color: '#1e293b' }}>
                            ✅ Por que é urgente?
                        </Typography>
                        <List dense>
                            {[
                                "Para que conheçam ao Senhor desde cedo",
                                "O inimigo bombardeia crianças com conteúdos destrutivos",
                                "Frutificarão por muito mais tempo se conhecerem Jesus cedo",
                                "Crianças são os melhores evangelistas para outras crianças"
                            ].map((text, i) => (
                                <ListItem key={i} sx={{ px: 0 }}>
                                    <Typography variant="body1" sx={{ color: '#475569', fontSize: '1rem' }}>→ {text}</Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={{
                        p: 4,
                        bgcolor: '#ffffff',
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <Typography variant="h6" fontWeight="800" gutterBottom sx={{ color: '#0891b2' }}>
                            💡 Reflexão
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#155e75', fontStyle: 'italic', lineHeight: 1.6, fontSize: '1.1rem' }}>
                            "85% das conversões acontecem entre 4 e 14 anos. Esta é a janela de oportunidade mais importante para alcançar vidas para Cristo!"
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default WhyEvangelizeData;
