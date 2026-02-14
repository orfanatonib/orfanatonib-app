import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface Step {
    title: string;
    desc: string;
    color: string;
}

interface TimelineStepProps {
    step: Step;
    index: number;
    isLeft: boolean;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ step, index, isLeft }) => {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: isLeft ? 'flex-end' : 'flex-start',
            mb: 4,
            position: 'relative',
            flexDirection: { xs: 'row', md: isLeft ? 'row' : 'row-reverse' }
        }}>
            <Box sx={{
                display: 'flex',
                width: '100%',
                flexDirection: { xs: 'row', md: isLeft ? 'row' : 'row-reverse' },
                alignItems: 'center'
            }}>
                {/* Content */}
                <Box sx={{
                    width: { xs: 'calc(100% - 60px)', md: '45%' },
                    ml: { xs: 8, md: isLeft ? 0 : 0 },
                    mr: { xs: 0, md: isLeft ? 0 : 0 },
                    order: { xs: 2, md: 1 },
                    textAlign: { xs: 'left', md: isLeft ? 'right' : 'left' }
                }}>
                    <motion.div
                        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-100px" }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: step.color }}>{step.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                        </Paper>
                    </motion.div>
                </Box>

                {/* Center Node */}
                <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: step.color,
                    border: '4px solid white',
                    boxShadow: '0 0 0 2px rgba(0,0,0,0.1)',
                    position: 'absolute',
                    left: { xs: 20, md: '50%' },
                    transform: 'translate(-50%, 0)', // Center properly
                    zIndex: 2,
                    order: { xs: 1 }
                }} />

                {/* Spacer for Desktop */}
                <Box sx={{ width: { xs: 0, md: '45%' }, order: { md: 2 } }} />
            </Box>
        </Box>
    );
};

const TimelineSection: React.FC = () => {
    const steps = [
        { title: "Oração e Regras", desc: "Ensina gratidão e estabelece ordem (silêncio, participação).", color: "#2196f3" },
        { title: "Lição Bíblica", desc: "A Bíblia é 100% verdade. Apresentar o Plano da Salvação.", color: "#4caf50" },
        { title: "Versículo", desc: "Memorização com recursos visuais criativos.", color: "#ff9800" },
        { title: "Revisão", desc: "Brincadeiras para fixar o conteúdo ensinado.", color: "#795548" },
        { title: "Lanche", desc: "Momento de evangelismo e comunhão.", color: "#e91e63" },
        { title: "Recepção/Mídia", desc: "Acolhimento e registro da visita.", color: "#9c27b0" }
    ];

    return (
        <Box sx={{ position: 'relative', py: 8 }}>
            <Box sx={{ position: 'absolute', left: { xs: 20, md: '50%' }, top: 0, bottom: 0, width: 2, bgcolor: 'rgba(0,0,0,0.1)', transform: 'translateX(-50%)' }} />

            {steps.map((step, index) => (
                <TimelineStep key={index} step={step} index={index} isLeft={index % 2 === 0} />
            ))}
        </Box>
    );
};

export default TimelineSection;
