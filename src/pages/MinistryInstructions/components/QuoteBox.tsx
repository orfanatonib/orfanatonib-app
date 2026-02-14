import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { FormatQuote as QuoteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface QuoteBoxProps {
    quote: string;
    reference: string;
    color?: string;
    variant?: 'dark' | 'light';
}

const QuoteBox: React.FC<QuoteBoxProps> = ({ quote, reference, color = '#6366f1', variant = 'dark' }) => {
    const isLight = variant === 'light';

    return (
        <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 20 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 5, md: 8 },
                    borderRadius: { xs: 8, md: 10 },
                    position: 'relative',
                    overflow: 'hidden',
                    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: isLight ? 'none' : 'blur(20px) saturate(180%)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isLight ? '0 30px 60px rgba(0,0,0,0.06)' : '0 40px 100px rgba(0,0,0,0.4)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '8px',
                        background: isLight
                            ? `linear-gradient(180deg, ${color} 0%, ${color}44 100%)`
                            : `linear-gradient(180deg, ${color} 0%, #000 100%)`,
                        boxShadow: isLight ? 'none' : `0 0 40px ${color}44`,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: isLight
                            ? `radial-gradient(circle at top left, ${color}08 0%, transparent 60%)`
                            : `radial-gradient(circle at top left, ${color}15 0%, transparent 60%)`,
                        pointerEvents: 'none'
                    }
                }}
            >
                {/* Decorative Background Quote Icon */}
                <QuoteIcon
                    sx={{
                        position: 'absolute',
                        top: -50,
                        right: -30,
                        fontSize: { xs: 180, md: 280 },
                        color: isLight ? `${color}05` : 'rgba(255, 255, 255, 0.03)',
                        transform: 'rotate(180deg)',
                        pointerEvents: 'none',
                        zIndex: 0
                    }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontStyle: 'normal',
                            color: isLight ? '#0f172a' : 'white',
                            mb: 6,
                            lineHeight: 1.4,
                            fontWeight: 300,
                            fontSize: { xs: '1.6rem', md: '2.5rem' },
                            letterSpacing: '-0.02em',
                            maxWidth: 1000,
                            textShadow: isLight ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
                            fontFamily: '"Outfit", sans-serif'
                        }}
                    >
                        "{quote}"
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{
                            width: 40,
                            height: 2,
                            background: isLight
                                ? `linear-gradient(90deg, ${color}, transparent)`
                                : `linear-gradient(90deg, ${color}, transparent)`
                        }} />
                        <Typography
                            sx={{
                                color: isLight ? '#475569' : 'white',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                fontSize: { xs: '0.85rem', md: '1rem' },
                                opacity: isLight ? 1 : 0.9,
                                textShadow: isLight ? 'none' : `0 0 15px ${color}88`
                            }}
                        >
                            {reference}
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </motion.div>
    );
};

export default QuoteBox;
