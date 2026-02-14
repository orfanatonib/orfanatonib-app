import React, { useRef, ReactNode } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion, useInView } from 'framer-motion';

export type DividerType = 'wave' | 'brush' | 'curve' | 'arrow' | 'none';

interface SectionContainerProps {
    id?: string;
    title: string;
    subtitle?: string;
    gradient: string;
    children: ReactNode;
    fullWidth?: boolean;
    topDivider?: DividerType;
    bottomDivider?: DividerType;
    dividerColor?: string;
    topDividerColor?: string;
    bottomDividerColor?: string;
    zIndex?: number;
}

const DividerSVG: React.FC<{ type: DividerType; color: string; position: 'top' | 'bottom' }> = ({ type, color, position }) => {
    if (type === 'none') return null;

    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        width: '100%',
        overflow: 'hidden',
        lineHeight: 0,
        zIndex: 2,
        pointerEvents: 'none'
    };

    if (position === 'top') {
        baseStyle.top = 0;
        baseStyle.transform = 'translateY(-99%) rotate(180deg)';
    } else {
        baseStyle.bottom = 0;
        baseStyle.transform = 'translateY(99%)';
    }

    let height = '80px';
    let viewBox = '0 0 1200 120';

    // For animated waves, we'll use motion.div with clipPath animation
    // The SVG path is converted to a clipPath polygon

    return (
        <motion.div
            style={{
                ...baseStyle,
                height: height,
                background: color,
            }}
            animate={{
                clipPath: position === 'bottom' ? [
                    // Bottom wave animations (organic flowing)
                    'polygon(0 0, 0 40%, 10% 35%, 20% 45%, 30% 38%, 40% 48%, 50% 42%, 60% 52%, 70% 45%, 80% 55%, 90% 48%, 100% 50%, 100% 0)',
                    'polygon(0 0, 0 45%, 10% 38%, 20% 48%, 30% 42%, 40% 52%, 50% 45%, 60% 55%, 70% 48%, 80% 58%, 90% 52%, 100% 55%, 100% 0)',
                    'polygon(0 0, 0 38%, 10% 42%, 20% 35%, 30% 45%, 40% 40%, 50% 50%, 60% 43%, 70% 53%, 80% 47%, 90% 57%, 100% 48%, 100% 0)',
                    'polygon(0 0, 0 40%, 10% 35%, 20% 45%, 30% 38%, 40% 48%, 50% 42%, 60% 52%, 70% 45%, 80% 55%, 90% 48%, 100% 50%, 100% 0)',
                ] : [
                    // Top wave animations (same but reversed)
                    'polygon(0 100%, 0 60%, 10% 65%, 20% 55%, 30% 62%, 40% 52%, 50% 58%, 60% 48%, 70% 55%, 80% 45%, 90% 52%, 100% 50%, 100% 100%)',
                    'polygon(0 100%, 0 55%, 10% 62%, 20% 52%, 30% 58%, 40% 48%, 50% 55%, 60% 45%, 70% 52%, 80% 42%, 90% 48%, 100% 45%, 100% 100%)',
                    'polygon(0 100%, 0 62%, 10% 58%, 20% 65%, 30% 55%, 40% 60%, 50% 50%, 60% 57%, 70% 47%, 80% 53%, 90% 43%, 100% 52%, 100% 100%)',
                    'polygon(0 100%, 0 60%, 10% 65%, 20% 55%, 30% 62%, 40% 52%, 50% 58%, 60% 48%, 70% 55%, 80% 45%, 90% 52%, 100% 50%, 100% 100%)',
                ],
            }}
            transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
};

const SectionContainer: React.FC<SectionContainerProps & { zIndex?: number }> = ({
    id,
    title,
    subtitle,
    gradient,
    children,
    fullWidth = true,
    topDivider = 'none',
    bottomDivider = 'none',
    dividerColor = '#f8f9fa',
    topDividerColor,
    bottomDividerColor,
    zIndex = 1
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.1, once: false });

    return (
        <Box
            id={id}
            ref={ref}
            sx={{
                position: 'relative',
                py: { xs: 12, md: 24 },
                background: gradient,
                width: '100%',
                zIndex: zIndex,
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                clipPath: bottomDivider === 'curve' ? 'url(#wave-clip)' : 'none',
                mb: bottomDivider === 'curve' ? -15 : 0, // Negative margin to overlap the wave
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.1) 100%)',
                    pointerEvents: 'none',
                    zIndex: 0
                }
            }}
        >
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <Typography
                        variant="h2"
                        fontWeight="900"
                        sx={{
                            color: 'white',
                            mb: subtitle ? 3 : 8,
                            textAlign: 'center',
                            textShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            fontSize: { xs: '2.8rem', md: '5.2rem' },
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                            fontFamily: '"Outfit", sans-serif'
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="h5"
                            sx={{
                                color: 'rgba(255,255,255,0.95)',
                                mb: 14,
                                textAlign: 'center',
                                fontWeight: 300,
                                maxWidth: 900,
                                mx: 'auto',
                                fontSize: { xs: '1.2rem', md: '1.6rem' },
                                letterSpacing: '0.02em',
                                lineHeight: 1.4,
                                textShadow: '0 4px 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </Container>

            {/* Reusable SVG ClipPath for the wave */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <clipPath id="wave-clip" clipPathUnits="objectBoundingBox">
                        <path d="M0,0 L1,0 L1,0.85 C0.8,0.95 0.6,0.85 0.4,1 C0.2,0.95 0,0.88 0,0.9 Z" />
                    </clipPath>
                </defs>
            </svg>
        </Box>
    );
};

export default SectionContainer;
