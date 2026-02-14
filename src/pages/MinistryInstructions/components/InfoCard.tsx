import React from 'react';
import { Box, Paper, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore as ExpandIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface DetailSection {
    title: string;
    content: string[];
    icon?: React.ReactNode;
}

interface InfoCardProps {
    title: string;
    subtitle?: string;
    sections: DetailSection[];
    color: string;
    delay?: number;
    variant?: 'glass' | 'clean';
}

const InfoCard: React.FC<InfoCardProps> = ({ title, subtitle, sections, color, delay = 0, variant = 'clean' }) => {
    const isGlass = variant === 'glass';

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%' }}
        >
            <Paper
                elevation={0}
                sx={{
                    borderRadius: { xs: 6, md: 8 },
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    backdropFilter: 'none',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isGlass ? 'none' : '0 10px 40px rgba(0,0,0,0.04)',
                    '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: isGlass
                            ? `0 40px 100px rgba(0,0,0,0.3)`
                            : `0 30px 60px rgba(0,0,0,0.08), 0 10px 20px rgba(0,0,0,0.04)`,
                        borderColor: color,
                        bgcolor: '#ffffff'
                    }
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: { xs: 2.2, md: 3.5 },
                        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                        color: 'white',
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}
                >
                    <Typography
                        fontWeight="900"
                        sx={{
                            fontSize: {
                                xs: 'clamp(1.1rem, 5vw, 1.35rem)',
                                md: '1.5rem'
                            },
                            letterSpacing: '-0.02em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.15)',
                            lineHeight: 1.2,
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word'
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="body2"
                            sx={{
                                opacity: 0.9,
                                mt: 1,
                                fontSize: { xs: '0.85rem', md: '0.95rem' },
                                fontWeight: 400,
                                letterSpacing: '0.01em'
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {/* Content */}
                <Box sx={{ p: { xs: 2, md: 3 }, flexGrow: 1 }}>
                    {sections.map((section, index) => (
                        <Accordion
                            key={index}
                            elevation={0}
                            sx={{
                                mb: 2,
                                bgcolor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                '&:before': { display: 'none' },
                                borderRadius: '20px !important',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&.Mui-expanded': {
                                    bgcolor: isGlass ? '#ffffff' : '#ffffff',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                                },
                                '&:hover': {
                                    bgcolor: '#ffffff',
                                    transform: 'translateX(6px)',
                                    borderColor: color
                                }
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandIcon sx={{ color: color, fontSize: '1.5rem' }} />}
                                sx={{
                                    px: 2,
                                    minHeight: 56,
                                    '& .MuiAccordionSummary-content': { my: 0 }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    {section.icon && (
                                        <Box sx={{
                                            color: color,
                                            display: 'flex',
                                            p: 0.8,
                                            borderRadius: '8px',
                                            bgcolor: `${color}15`
                                        }}>
                                            {section.icon}
                                        </Box>
                                    )}
                                    <Typography
                                        fontWeight="800"
                                        sx={{
                                            fontSize: { xs: '1rem', sm: '1.1rem' },
                                            color: '#0f172a',
                                            letterSpacing: '-0.01em'
                                        }}
                                    >
                                        {section.title}
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 1, pb: 2, px: 2.5 }}>
                                {section.content.map((item, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', mb: 1, gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={{
                                            mt: '7px',
                                            width: 5,
                                            height: 5,
                                            borderRadius: '50%',
                                            bgcolor: color,
                                            flexShrink: 0
                                        }} />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#475569',
                                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                lineHeight: 1.6,
                                                fontWeight: 450
                                            }}
                                        >
                                            {item}
                                        </Typography>
                                    </Box>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Paper>
        </motion.div>
    );
};

export default InfoCard;
