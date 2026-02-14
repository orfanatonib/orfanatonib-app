import React from 'react';
import { Paper, Typography, Grid, Box, Divider, List, ListItem } from '@mui/material';
import {
    ChildCare as ChildIcon,
    Groups as GroupIcon,
    EscalatorWarning as TeenIcon,
    Person as AdultIcon,
    Event as EventIcon,
    People as PeopleIcon,
    WhatsApp as PhoneIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ShelterSectorsSection: React.FC = () => {
    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: 6,
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
                }}
            >
                <Typography variant="h6" fontWeight="900" gutterBottom sx={{ color: '#4f46e5', letterSpacing: '-0.02em' }}>
                    🏠 Realidades Diferentes
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight="700" color="#1e293b">
                                Pessoas com atraso intelectual
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight="700" color="#1e293b">
                                Mulheres mães de família
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight="700" color="#1e293b">
                                Bebês de colo
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight="700" color="#1e293b">
                                Diferentes faixas etárias
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
                <Typography variant="body2" sx={{ mt: 3, fontStyle: 'italic', color: '#64748b' }}>
                    💡 Mesmo com realidades diferentes, a visita segue um padrão estabelecido.
                </Typography>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.6 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                borderRadius: 8,
                                height: '100%',
                                bgcolor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.04)',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    transform: 'translateY(-10px)',
                                    boxShadow: '0 30px 70px rgba(15, 23, 42, 0.08)',
                                    borderColor: 'currentColor'
                                }
                            }}
                        >
                            <Typography variant="h6" fontWeight="900" gutterBottom sx={{ color: '#4f46e5', letterSpacing: '-0.02em' }}>
                                👶 Setores por Faixa Etária
                            </Typography>
                            <Divider sx={{ my: 3, opacity: 0.6 }} />
                            <List>
                                <ListItem sx={{ px: 0 }}>
                                    <ChildIcon sx={{ mr: 2, color: '#4f46e5' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Baby:</strong> Crianças pequenas
                                    </Typography>
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <ChildIcon sx={{ mr: 2, color: '#4f46e5' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Infantil:</strong> Crianças
                                    </Typography>
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <GroupIcon sx={{ mr: 2, color: '#4f46e5' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Kids:</strong> Crianças maiores
                                    </Typography>
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <TeenIcon sx={{ mr: 2, color: '#4f46e5' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Adolescentes:</strong> Separados por gênero
                                    </Typography>
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <AdultIcon sx={{ mr: 2, color: '#4f46e5' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Adultos:</strong> E cuidadores
                                    </Typography>
                                </ListItem>
                            </List>
                        </Paper>
                    </motion.div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.6 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                borderRadius: 8,
                                height: '100%',
                                bgcolor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.04)',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    transform: 'translateY(-10px)',
                                    boxShadow: '0 30px 70px rgba(15, 23, 42, 0.08)',
                                    borderColor: 'currentColor'
                                }
                            }}
                        >
                            <Typography variant="h6" fontWeight="900" gutterBottom sx={{ color: '#0891b2', letterSpacing: '-0.02em' }}>
                                🎯 Setores de Suporte
                            </Typography>
                            <Divider sx={{ my: 3, opacity: 0.6 }} />
                            <List>
                                <ListItem sx={{ px: 0 }}>
                                    <EventIcon sx={{ mr: 2, color: '#0891b2' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Lanche Evangelístico:</strong> Preparação e distribuição
                                    </Typography>
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <PeopleIcon sx={{ mr: 2, color: '#0891b2' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Recepção:</strong> Acolhimento, etiquetas de identificação e convite para próximas visitas
                                    </Typography>
                                </ListItem>
                                <ListItem sx={{ px: 0 }}>
                                    <PhoneIcon sx={{ mr: 2, color: '#0891b2' }} />
                                    <Typography variant="body1" sx={{ color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Mídias:</strong> Captar imagens para relatórios e convites das próximas visitas
                                    </Typography>
                                </ListItem>
                            </List>
                            <Box sx={{ mt: 3, p: 3, bgcolor: '#f8fafc', borderRadius: 4, border: '2px dashed #0891b2' }}>
                                <Typography variant="body2" sx={{ color: '#0891b2', fontWeight: 600, textAlign: 'center' }}>
                                    💡 Cada membro será alocado em um setor conforme necessidade e habilidades do grupo.
                                </Typography>
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </>
    );
};

export default ShelterSectorsSection;
