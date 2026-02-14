import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    Handshake as PrayIcon,
    MenuBook as BookIcon,
    EmojiEvents as TrophyIcon,
    MusicNote as MusicIcon,
    Restaurant as FoodIcon,
    Mic as SpeakIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface TimelineStep {
    number: number;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
}

const VisitTimeline: React.FC = () => {
    const steps: TimelineStep[] = [
        {
            number: 1,
            title: 'Oração e Regras',
            description: 'Boas-vindas, oração de gratidão e apresentação das regras',
            icon: PrayIcon,
            color: '#c084fc' // Refined Purple
        },
        {
            number: 2,
            title: 'Lição Bíblica',
            description: 'Apresentar a Bíblia como 100% verdade. Desenvolvimento, aplicação e apelo.',
            icon: BookIcon,
            color: '#60a5fa'
        },
        {
            number: 3,
            title: 'Versículo',
            description: 'Memorizar com visuais. Dica: Usar Letra Bastão/Maiúscula para os menores.',
            icon: SpeakIcon,
            color: '#fbbf24'
        },
        {
            number: 4,
            title: 'Brincadeira',
            description: 'Revisão da história com diversão e segurança. Retenção do aprendizado.',
            icon: TrophyIcon,
            color: '#4ade80'
        },
        {
            number: 5,
            title: 'Música',
            description: 'Louvor com coreografia: homens seguem homens, mulheres seguem mulheres.',
            icon: MusicIcon,
            color: '#f472b6'
        },
        {
            number: 6,
            title: 'Lanche Evangelístico',
            description: 'Organizar com higiene. Evangelizar usando o alimento para revisar o tema.',
            icon: FoodIcon,
            color: '#22d3ee'
        },
    ];

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
            {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                    <Box key={step.number} sx={{ position: 'relative', mb: index < steps.length - 1 ? { xs: 3, md: 4 } : 0 }}>
                        <motion.div
                            initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: false }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <Box
                                sx={{
                                    p: { xs: 3, sm: 4, md: 5 },
                                    background: '#ffffff',
                                    borderRadius: 8,
                                    border: '1px solid #e2e8f0',
                                    borderLeft: `8px solid ${step.color}`,
                                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    '&:hover': {
                                        transform: { xs: 'translateX(6px)', md: 'translateX(12px)' },
                                        boxShadow: `0 30px 60px rgba(0,0,0,0.12)`,
                                        borderColor: step.color,
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                                    {/* Number Badge */}
                                    <Box
                                        sx={{
                                            width: { xs: 45, sm: 50, md: 55 },
                                            height: { xs: 45, sm: 50, md: 55 },
                                            borderRadius: '50%',
                                            background: step.color,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 900,
                                            fontSize: { xs: '1.2rem', sm: '1.35rem', md: '1.5rem' },
                                            flexShrink: 0,
                                            boxShadow: `0 0 30px ${step.color}44`
                                        }}
                                    >
                                        {step.number}
                                    </Box>

                                    {/* Icon */}
                                    <Icon sx={{
                                        fontSize: 40,
                                        color: step.color,
                                        opacity: 0.9,
                                        display: { xs: 'none', sm: 'block' }
                                    }} />

                                    {/* Content */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="h6"
                                            fontWeight="900"
                                            sx={{
                                                mb: 0.5,
                                                color: '#0f172a',
                                                fontSize: { xs: '1.2rem', md: '1.5rem' },
                                                letterSpacing: '-0.03em'
                                            }}
                                        >
                                            {step.title}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: '#475569',
                                                fontSize: { xs: '0.95rem', md: '1.1rem' },
                                                fontWeight: 450,
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {step.description}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </motion.div>

                        {/* Connector */}
                        {index < steps.length - 1 && (
                            <Box
                                sx={{
                                    width: { xs: 2, md: 3 },
                                    height: { xs: 20, md: 30 },
                                    background: step.color,
                                    marginLeft: { xs: '19px', sm: '22px', md: '24px' },
                                    marginY: 1,
                                    opacity: 0.5
                                }}
                            />
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

export default VisitTimeline;
