import React from 'react';
import { Grid, Paper, Typography, Box, Divider, Chip } from '@mui/material';
import {
    EmojiPeople as PeopleIcon,
    Favorite as HeartIcon,
    Campaign as CampaignIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import IconBadge from './IconBadge';

const IdentityCards: React.FC = () => {
    return (
        <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* Card 1: Quem Somos */}
            <Grid item xs={12} md={4}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6 }}
                >
                    <Box sx={{
                        p: 4,
                        borderRadius: 6,
                        height: '100%',
                        textAlign: 'center',
                        background: '#ffffff',
                        // backdropFilter removed
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-10px)',
                            boxShadow: '0 60px 120px rgba(0,0,0,0.2)'
                        }
                    }}>
                        <IconBadge icon={<PeopleIcon sx={{ fontSize: 35 }} />} color="#0891b2" />
                        <Typography variant="h5" fontWeight="900" gutterBottom sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Quem Somos
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', mb: 2, fontWeight: 700 }}>
                            Resposta de oração
                        </Typography>
                        <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.08)' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', mb: 2 }}>
                            "Por isso, orai ao Senhor da seara e pedi que Ele mande mais trabalhadores para a sua colheita."
                        </Typography>
                        <Chip label="Mateus 9:38" size="small" sx={{ color: '#0f172a', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }} />
                    </Box>
                </motion.div>
            </Grid>

            {/* Card 2: Nosso Foco */}
            <Grid item xs={12} md={4}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                >
                    <Box sx={{
                        p: 4,
                        borderRadius: 6,
                        height: '100%',
                        textAlign: 'center',
                        background: '#ffffff',
                        // backdropFilter removed
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'translateY(-10px)' }
                    }}>
                        <IconBadge icon={<CampaignIcon sx={{ fontSize: 35 }} />} color="#e11d48" />
                        <Typography variant="h5" fontWeight="900" gutterBottom sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Nosso Foco
                        </Typography>
                        <Box sx={{
                            display: 'inline-block',
                            mt: 2,
                            p: 3,
                            background: '#ffffff',
                            borderRadius: 4,
                            border: '2px solid #e11d48'
                        }}>
                            <Typography variant="h3" fontWeight="900" sx={{ color: '#e11d48', lineHeight: 1 }}>
                                E
                            </Typography>
                            <Typography variant="h6" fontWeight="900" sx={{ color: '#e11d48', mt: 1 }}>
                                EVANGELIZAR
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>
            </Grid>

            {/* Card 3: Nossa Missão */}
            <Grid item xs={12} md={4}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Box sx={{
                        p: 4,
                        borderRadius: 6,
                        height: '100%',
                        textAlign: 'center',
                        background: '#ffffff',
                        // backdropFilter removed
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'translateY(-10px)' }
                    }}>
                        <IconBadge icon={<HeartIcon sx={{ fontSize: 35 }} />} color="#f59e0b" />
                        <Typography variant="h5" fontWeight="900" gutterBottom sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Nossa Missão
                        </Typography>
                        <Box sx={{
                            mt: 3,
                            p: 3,
                            background: '#ffffff',
                            borderRadius: 4,
                            border: '2px solid #f59e0b'
                        }}>
                            <Typography variant="h6" fontWeight="900" sx={{ color: '#f59e0b' }}>
                                Evangelizar nos Abrigos
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>
            </Grid>
        </Grid>
    );
};

export default IdentityCards;
