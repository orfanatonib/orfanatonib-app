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

const QuoteBox: React.FC<QuoteBoxProps> = ({ quote, reference, color = '#6366f1', variant = 'light' }) => {
    const isLight = variant === 'light' || variant === 'dark'; // We are making everything striking light now as requested

    return (
        <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 20 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -5 }}
            viewport={{ once: false }}
            transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                y: { type: 'spring', stiffness: 300, damping: 20 }
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 5, md: 8 },
                    borderRadius: { xs: 8, md: 10 },
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: `1px solid ${color}22`,
                    boxShadow: `0 40px 100px -20px ${color}15, 0 20px 40px -15px rgba(0,0,0,0.05)`,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '12px',
                        background: `linear-gradient(180deg, ${color} 0%, ${color}aa 100%)`,
                        boxShadow: `4px 0 20px ${color}22`,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at top left, ${color}12 0%, transparent 60%)`,
                        pointerEvents: 'none'
                    }
                }}
            >
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        top: -50,
                        right: -30,
                        pointerEvents: 'none',
                        zIndex: 0
                    }}
                >
                    <QuoteIcon
                        sx={{
                            fontSize: { xs: 180, md: 280 },
                            color: `${color}08`,
                            transform: 'rotate(180deg)',
                        }}
                    />
                </motion.div>

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontStyle: 'normal',
                            color: '#1e293b',
                            mb: 6,
                            lineHeight: 1.3,
                            fontWeight: 700,
                            fontSize: { xs: '1.8rem', md: '2.8rem' },
                            letterSpacing: '-0.03em',
                            maxWidth: 1000,
                            textShadow: '0 2px 10px rgba(0,0,0,0.02)',
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
                                color: color,
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.25em',
                                fontSize: { xs: '0.9rem', md: '1.1rem' },
                                opacity: 1,
                                textShadow: `0 2px 10px ${color}22`
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
