import React from 'react';
import { Paper, Grid, Box, Typography, Divider, List, ListItem } from '@mui/material';
import {
    WhatsApp as PhoneIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';

const CommunicationSection: React.FC = () => {
    return (
        <Paper elevation={0} sx={{
            p: { xs: 2, sm: 4, md: 6 },
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
            transition: 'transform 0.4s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 50px 120px rgba(0,0,0,0.3)',
                borderColor: '#0891b2'
            },
            overflow: 'hidden'
        }}>
            <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        textAlign: 'center',
                        height: '100%',
                        p: { xs: 2, md: 4 },
                        background: '#ffffff',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <PhoneIcon sx={{ fontSize: { xs: 40, md: 64 }, color: '#0891b2', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight="900" sx={{
                            color: '#0f172a',
                            letterSpacing: '-0.02em',
                            mb: 1,
                            fontSize: { xs: 'clamp(0.95rem, 4vw, 1.1rem)', md: '1.25rem' }
                        }}>
                            ✅ Use o Grupo Para
                        </Typography>
                        <Divider sx={{ mb: 2, width: '100%', opacity: 0.1 }} />
                        <List dense sx={{ width: '100%' }}>
                            {['Assuntos do ministério', 'Avisos importantes', 'Confirmações de presença', 'Dúvidas sobre atividades'].map((item, i) => (
                                <ListItem key={i} sx={{ color: '#334155', justifyContent: 'center', py: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.95rem' }, textAlign: 'center' }}>
                                        <Box component="span" sx={{ color: '#0891b2', mr: 0.5 }}>✓</Box> {item}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        textAlign: 'center',
                        height: '100%',
                        p: { xs: 2, md: 4 },
                        background: '#ffffff',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', width: { xs: 40, md: 64 }, height: { xs: 40, md: 64 }, borderRadius: '50%', bgcolor: '#fef2f2' }}>
                            <Typography sx={{ color: '#ef4444', fontSize: { xs: '1.2rem', md: '1.5rem' } }}>❌</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="900" sx={{
                            color: '#991b1b',
                            letterSpacing: '-0.02em',
                            mb: 1,
                            fontSize: { xs: 'clamp(0.95rem, 4vw, 1.1rem)', md: '1.25rem' }
                        }}>
                            NÃO Use Para
                        </Typography>
                        <Divider sx={{ mb: 2, width: '100%', opacity: 0.1 }} />
                        <List dense sx={{ width: '100%' }}>
                            {['Bom dia / Boa noite', 'Mensagens motivacionais', 'Ofertas pessoais', 'Vagas de emprego', 'Correntes / memes'].map((item, i) => (
                                <ListItem key={i} sx={{ color: '#334155', justifyContent: 'center', py: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.95rem' }, textAlign: 'center' }}>
                                        <Box component="span" sx={{ color: '#ef4444', mr: 0.5, fontWeight: 900 }}>✗</Box> {item}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        textAlign: 'center',
                        height: '100%',
                        p: { xs: 2, md: 4 },
                        background: '#ffffff',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <AssignmentIcon sx={{ fontSize: { xs: 40, md: 64 }, color: '#b45309', mb: 1.5 }} />
                        <Typography variant="h6" fontWeight="900" sx={{
                            color: '#0f172a',
                            letterSpacing: '-0.02em',
                            mb: 1,
                            fontSize: { xs: 'clamp(0.95rem, 4vw, 1.1rem)', md: '1.25rem' }
                        }}>
                            📋 Direcionamentos
                        </Typography>
                        <Divider sx={{ mb: 2, width: '100%', opacity: 0.1 }} />
                        <List dense sx={{ width: '100%' }}>
                            {[
                                { label: 'Oração:', value: ' GA' },
                                { label: 'Acolhimento:', value: ' líder' },
                                { label: 'Privado:', value: ' assuntos pessoais' }
                            ].map((item, i) => (
                                <ListItem key={i} sx={{ color: '#475569', justifyContent: 'center', flexDirection: 'column', py: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</Typography>
                                    <Typography variant="body2" sx={{ color: '#b45309', fontWeight: 700, fontSize: { xs: '0.85rem', md: '1rem' } }}>{item.value}</Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default CommunicationSection;
