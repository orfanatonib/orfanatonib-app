import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import {
    CheckBox as CheckIcon,
    Schedule as BeforeIcon,
    Groups as DuringIcon,
    AssignmentTurnedIn as AfterIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ChecklistItem {
    text: string;
}

const ChecklistSection: React.FC = () => {
    const beforeItems: ChecklistItem[] = [
        { text: 'Confirmar calendário e horário' },
        { text: 'Uniforme completo' },
        { text: 'Materiais/visuais finalizados' },
        { text: 'Versículo e música memorizados' },
        { text: 'Lanche combinado (se comprometeu)' },
        { text: 'Alinhar carona amiga' }
    ];

    const duringItems: ChecklistItem[] = [
        { text: 'Cumprir regras de segurança' },
        { text: 'Manter linguagem adequada' },
        { text: 'Seguir roteiro e liderança' },
        { text: 'Foco: evangelizar' }
    ];

    const afterItems: ChecklistItem[] = [
        { text: 'Encerrar conforme orientação' },
        { text: 'Relatório e registros (mídia)' },
        { text: 'Ajustes para próxima visita' }
    ];

    const renderChecklist = (title: string, items: ChecklistItem[], icon: React.ElementType, color: string, delay: number) => {
        const Icon = icon;
        return (
            <Grid item xs={12} sm={6} md={4}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6, delay }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, md: 4 },
                            height: '100%',
                            bgcolor: '#ffffff',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                            '&:hover': {
                                borderColor: color,
                                transform: 'translateY(-10px)',
                                boxShadow: `0 30px 60px ${color}15`
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Icon sx={{ fontSize: { xs: 28, sm: 30, md: 36 }, color, mr: 2 }} />
                            <Typography
                                variant="h6"
                                fontWeight="900"
                                sx={{
                                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                                    color: '#0f172a',
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                {title}
                            </Typography>
                        </Box>
                        <Box>
                            {items.map((item, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        mb: 2
                                    }}
                                >
                                    <CheckIcon sx={{ color, fontSize: 22, mr: 1.5, mt: 0.2, flexShrink: 0 }} />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontSize: '1rem',
                                            color: '#475569',
                                            lineHeight: 1.6,
                                            '& strong': { color: '#0f172a', fontWeight: 800 }
                                        }}
                                    >
                                        {item.text}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </motion.div>
            </Grid>
        );
    };

    return (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {renderChecklist('Antes', beforeItems, BeforeIcon, '#2196f3', 0)}
            {renderChecklist('Durante', duringItems, DuringIcon, '#ff9800', 0.15)}
            {renderChecklist('Depois', afterItems, AfterIcon, '#4caf50', 0.3)}
        </Grid>
    );
};

export default ChecklistSection;
