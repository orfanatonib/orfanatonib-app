import React from 'react';
import { Box, Typography, Button, Container, IconButton } from '@mui/material';
import { KeyboardArrowDown as ScrollDownIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
// @ts-ignore
import heroPuzzleImage from '../../../assets/images/hero_puzzle.png';

const HeroSection: React.FC = () => {
    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: { xs: '60vh', sm: '80vh', md: '90vh' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#fff',
                overflow: 'hidden',
                mt: { xs: -2, sm: 0 },
            }}
        >
            {/* Background Image */}
            <Box
                component="img"
                src={heroPuzzleImage}
                alt="Banner Orfanatos NIB"
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0,
                }}
            />

            {/* Dark Overlay matching Home */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.65) 100%)', // Lighter overlay to show more vibrant colors
                    zIndex: 1,
                }}
            />

            {/* Floating Particles Animation matching Home */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        background: '#FFEB3B',
                        borderRadius: '50%',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        zIndex: 2,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}

            <Container
                maxWidth="lg"
                sx={{
                    position: 'relative',
                    zIndex: 3,
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >

                    <Typography
                        variant="h1"
                        component="h1"
                        sx={{
                            fontSize: { xs: '2.2rem', sm: '4rem', md: '7rem', lg: '8.5rem' },
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #fff 30%, #ffd700 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            fontFamily: '"Outfit", sans-serif',
                            mb: { xs: 2, md: 3 },
                            lineHeight: 0.9,
                            letterSpacing: '-0.04em',
                            textTransform: 'uppercase'
                        }}
                    >
                        Manual do <br /> Membro
                    </Typography>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontSize: { xs: '1rem', sm: '1.5rem', md: '1.8rem', lg: '2rem' },
                            color: '#FFFFFF',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            mb: { xs: 6, md: 8 },
                            fontWeight: 300,
                            maxWidth: '900px',
                            mx: 'auto',
                            lineHeight: 1.4,
                            fontFamily: '"Outfit", sans-serif',
                            letterSpacing: '0.02em',
                            opacity: 0.9
                        }}
                    >
                        Diretrizes e princípios para servir com excelência e impactar a próxima geração através do evangelho.
                    </Typography>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)' }}
                >
                    <IconButton
                        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                        sx={{
                            color: 'white',
                            animation: 'bounce 2s infinite',
                            opacity: 0.9,
                            '&:hover': {
                                opacity: 1,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        <ScrollDownIcon fontSize="large" />
                    </IconButton>
                </motion.div>

            </Container>
        </Box>
    );
};

export default HeroSection;
