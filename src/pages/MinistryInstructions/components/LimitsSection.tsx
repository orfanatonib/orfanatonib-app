import React from 'react';
import { Grid, Paper, Typography, Divider, List, ListItem, Box } from '@mui/material';

const LimitsSection: React.FC = () => {
    return (
        <Grid container spacing={{ xs: 2.5, md: 4 }}>
            <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{
                    p: { xs: 2, sm: 3, md: 5 },
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    height: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(-10px)' }
                }}>
                    <Typography
                        fontWeight="900"
                        sx={{
                            color: '#991b1b',
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            mb: 2
                        }}
                    >
                        🚫 NÃO Permitido
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.08)' }} />
                    <List dense>
                        {[
                            { text: 'Doações', extra: '(exceto autorizadas)' },
                            { text: 'Caridades', extra: 'individuais' },
                            { text: 'Assistência profissional', extra: 'direta' },
                            { text: 'Brindes / prêmios', extra: 'sem autorização' }
                        ].map((item, i) => (
                            <ListItem key={i} sx={{ px: 0, py: 0.8 }}>
                                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                                    ❌ <strong style={{ color: '#991b1b' }}>{item.text}</strong> {item.extra}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{
                    p: { xs: 2, sm: 3, md: 5 },
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    height: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(-10px)' }
                }}>
                    <Typography
                        fontWeight="900"
                        sx={{
                            color: '#166534',
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            mb: 2
                        }}
                    >
                        ✅ Nosso Foco
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.08)' }} />
                    <Box sx={{
                        textAlign: 'center',
                        p: { xs: 1.5, sm: 3, md: 4 },
                        background: '#ffffff',
                        borderRadius: 5,
                        mb: 3,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden'
                    }}>
                        <Typography fontWeight="900" sx={{
                            color: '#166534',
                            letterSpacing: { xs: '0.02em', md: '0.1em' },
                            mb: 0.5,
                            lineHeight: 1,
                            fontSize: {
                                xs: 'clamp(1rem, 6.5vw, 1.3rem)',
                                sm: '2.5rem',
                                md: '3rem'
                            },
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                        }}>
                            EVANGELIZAR
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#334155', fontWeight: 800, letterSpacing: '0.1em', display: 'block' }}>
                            FOCO ÚNICO E EXCLUSIVO
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500, lineHeight: 1.6, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                        💡 <strong style={{ color: '#166534' }}>Deseja atuar com caridade / assistência?</strong><br />
                        A NIB tem setores específicos. Aqui focamos 100% em evangelização.
                    </Typography>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default LimitsSection;
