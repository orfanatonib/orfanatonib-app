import React from 'react';
import { Box, Divider as MuiDivider } from '@mui/material';
import { motion } from 'framer-motion';

interface SectionDividerProps {
    variant?: 'wave' | 'dots' | 'gradient' | 'zigzag';
    color?: string;
}

const SectionDivider: React.FC<SectionDividerProps> = ({ variant = 'gradient', color = '#667eea' }) => {
    if (variant === 'wave') {
        return (
            <Box sx={{ position: 'relative', height: 100, overflow: 'hidden' }}>
                <svg
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    style={{ height: '100%', width: '100%' }}
                >
                    <motion.path
                        d="M0,0 Q300,60 600,0 T1200,0 V120 H0 Z"
                        fill={color}
                        opacity={0.1}
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 1.5 }}
                    />
                    <motion.path
                        d="M0,20 Q300,80 600,20 T1200,20 V120 H0 Z"
                        fill={color}
                        opacity={0.05}
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                    />
                </svg>
            </Box>
        );
    }

    if (variant === 'dots') {
        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: false }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: color,
                                    opacity: i === 2 ? 1 : 0.3
                                }}
                            />
                        </motion.div>
                    ))}
                </Box>
            </Box>
        );
    }

    if (variant === 'zigzag') {
        return (
            <Box sx={{ py: 4 }}>
                <svg width="100%" height="30" viewBox="0 0 1200 30">
                    <motion.path
                        d="M0,15 L60,5 L120,15 L180,5 L240,15 L300,5 L360,15 L420,5 L480,15 L540,5 L600,15 L660,5 L720,15 L780,5 L840,15 L900,5 L960,15 L1020,5 L1080,15 L1140,5 L1200,15"
                        stroke={color}
                        strokeWidth="3"
                        fill="none"
                        opacity={0.2}
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 2 }}
                    />
                </svg>
            </Box>
        );
    }

    // gradient (default)
    return (
        <Box sx={{ py: 8, position: 'relative' }}>
            <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 1 }}
            >
                <Box
                    sx={{
                        height: 3,
                        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                        borderRadius: 2
                    }}
                />
            </motion.div>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 40,
                    height: 40,
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <motion.div
                    animate={{
                        rotate: 360
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: `3px solid ${color}`,
                            borderTopColor: 'transparent'
                        }}
                    />
                </motion.div>
            </Box>
        </Box>
    );
};

export default SectionDivider;
