import React from 'react';
import { Grid, Paper, Typography, Divider, List, ListItem, Box } from '@mui/material';
import {
    AccessTime as TimeIcon,
    Event as EventIcon
} from '@mui/icons-material';
import InfoCard from './InfoCard';

const VisitDaySection: React.FC = () => {
    return (
        <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
                <InfoCard
                    title="Antes de Sair"
                    subtitle="Ponto de encontro e preparação"
                    color="#f59e0b"
                    variant="glass"
                    sections={[
                        {
                            icon: <TimeIcon />,
                            title: 'Horário e Local',
                            content: [
                                'Encontro na NIB no horário combinado',
                                'Seja pontual - respeite o tempo dos outros',
                                'Confirme o horário com antecedência'
                            ]
                        },
                        {
                            icon: <EventIcon />,
                            title: 'O que Trazer',
                            content: [
                                'Lanche que você se comprometeu',
                                'Materiais necessários para sua função',
                                'Uniforme COMPLETO vestido',
                                'Disposição e alegria!'
                            ]
                        }
                    ]}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 3.5 },
                        borderRadius: 8,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                            transform: 'translateY(-10px)',
                            boxShadow: '0 60px 120px rgba(0,0,0,0.2)',
                            borderColor: '#ef4444'
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3.5, gap: 2 }}>
                        <Box sx={{
                            display: 'flex',
                            p: 1.2,
                            borderRadius: '12px',
                            bgcolor: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fee2e2'
                        }}>
                            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>🚫</Typography>
                        </Box>
                        <Box>
                            <Typography fontWeight="900" sx={{ color: '#991b1b', letterSpacing: '-0.02em', lineHeight: 1.1, fontSize: { xs: '1rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                                Regras
                            </Typography>
                            <Typography fontWeight="900" sx={{ color: '#450a0a', letterSpacing: '-0.02em', lineHeight: 1.1, fontSize: { xs: '1.15rem', md: '1.4rem' } }}>
                                INEGOCIÁVEIS
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 3, width: '100%', opacity: 0.1 }} />

                    <Box sx={{ flexGrow: 1 }}>
                        <List sx={{ mt: 0, p: 0 }}>
                            {[
                                { icon: '❌', text: 'Sem uniforme completo = ', strong: 'NÃO PARTICIPA' },
                                { icon: '❌', text: 'Não é permitido levar ', strong: 'crianças' },
                                { icon: '✅', text: '"Carona amiga" é ', strong: 'cultura' },
                                { icon: '✅', text: 'Líderes auxiliares - ', strong: 'Dúvidas? Pergunte!' }
                            ].map((item, idx) => (
                                <ListItem key={idx} sx={{ px: 0, py: 1.2, alignItems: 'flex-start' }}>
                                    <Box sx={{
                                        minWidth: 28,
                                        height: 28,
                                        borderRadius: '8px',
                                        bgcolor: item.icon === '❌' ? '#fef2f2' : '#f0fdf4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2,
                                        fontSize: '0.9rem',
                                        border: '1px solid',
                                        borderColor: item.icon === '❌' ? '#fee2e2' : '#dcfce7'
                                    }}>
                                        {item.icon}
                                    </Box>
                                    <Typography sx={{ color: '#334155', fontSize: { xs: '0.85rem', md: '0.95rem' }, fontWeight: 500, lineHeight: 1.4 }}>
                                        {item.text}
                                        {item.strong && <Box component="span" sx={{ fontWeight: 800, color: item.icon === '❌' ? '#ef4444' : '#166534' }}>{item.strong}</Box>}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default VisitDaySection;
