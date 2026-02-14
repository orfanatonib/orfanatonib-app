import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import { motion } from 'framer-motion';

const FrequencyWarning: React.FC = () => {
    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <Paper elevation={0} sx={{
                p: { xs: 2, sm: 4, md: 6 },
                borderRadius: 8,
                border: '1px solid #ef4444',
                bgcolor: '#ffffff',
                boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 50px 120px rgba(0,0,0,0.3)'
                },
                overflow: 'hidden'
            }}>
                <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 4 } }}>
                    <Typography fontWeight="900" sx={{
                        color: '#7f1d1d',
                        letterSpacing: '0.1em',
                        mb: 0.5,
                        fontSize: {
                            xs: 'clamp(1rem, 7vw, 1.5rem)',
                            sm: '2.5rem',
                            md: '3rem'
                        },
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word'
                    }}>
                        ⚠️ ATENÇÃO
                    </Typography>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#450a0a', opacity: 0.9, letterSpacing: '0.05em' }}>
                        REGRAS DE FREQUÊNCIA
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4, borderColor: 'rgba(0,0,0,0.12)' }} />

                <Box sx={{
                    p: 3,
                    bgcolor: '#ffffff',
                    borderRadius: 5,
                    mb: 3,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 900, mb: 0.5 }}>
                        2 faltas injustificadas
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#450a0a', fontWeight: 700 }}>
                        = LIBERAÇÃO DO MINISTÉRIO
                    </Typography>
                </Box>

                <Box sx={{
                    p: 3,
                    bgcolor: '#ffffff',
                    borderRadius: 5,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <Typography variant="h5" sx={{ color: '#ef4444', fontWeight: 900, mb: 0.5 }}>
                        3 faltas justificadas
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#450a0a', fontWeight: 700 }}>
                        = LIBERAÇÃO DO MINISTÉRIO
                    </Typography>
                </Box>
            </Paper>
        </motion.div>
    );
};

export default FrequencyWarning;
