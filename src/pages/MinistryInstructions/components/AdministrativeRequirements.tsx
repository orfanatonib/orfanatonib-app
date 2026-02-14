import React from 'react';
import { Paper, Typography, Grid, Box, Divider } from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import IconBadge from './IconBadge';

const AdministrativeRequirements: React.FC = () => {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
        >
            <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'inline-flex', mb: 3 }}>
                    <IconBadge icon={<AssignmentIcon sx={{ fontSize: 40 }} />} color="#06b6d4" size={80} />
                </Box>

                <Grid container spacing={4} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{
                            p: 4,
                            bgcolor: '#ffffff',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                            height: '100%',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                                borderColor: '#06b6d4'
                            }
                        }}>
                            <Typography variant="h5" fontWeight="900" gutterBottom sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                                📋 Documentação Obrigatória
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                Será solicitada <strong>declaração de antecedentes criminais</strong> para todos os membros.
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{
                            p: 4,
                            bgcolor: '#ffffff',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                            height: '100%',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
                                borderColor: '#06b6d4'
                            }
                        }}>
                            <Typography variant="h5" fontWeight="900" gutterBottom sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                                👕 Uniforme Completo
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                Uniforme completo é <strong>indispensável</strong> para as atividades externas. Sem exceções.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
                <Typography variant="body1" sx={{ mt: 5, color: '#64748b', fontStyle: 'italic', fontWeight: 300 }}>
                    💡 Se não puder comprar a camisa ou comparecer, avise imediatamente a liderança.
                </Typography>
            </Box>
        </motion.div>
    );
};

export default AdministrativeRequirements;
