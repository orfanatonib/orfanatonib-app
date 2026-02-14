import React, { useRef } from 'react';
import { Box, Grid, Typography, List, ListItem } from '@mui/material';
import { CheckCircle as CheckIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { motion, useInView } from 'framer-motion';
import dressCodeImage from '../../../assets/images/dress_code.png';

const DressCodeSection: React.FC = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.3, once: false });

    return (
        <Box ref={ref} sx={{ position: 'relative', my: 2, overflow: 'hidden' }}>
            <Grid container spacing={6} alignItems="center">
                {/* Image Side - Glassmorphic */}
                <Grid item xs={12} md={5}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, x: -50 }}
                        whileInView={{ scale: 1, opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, type: "spring" }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Box sx={{
                            position: 'relative',
                            p: 3,
                            background: '#ffffff',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 60px 120px rgba(0,0,0,0.3)',
                            width: '100%',
                            maxWidth: 500,
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <Box
                                component="img"
                                src={dressCodeImage}
                                alt="Dress Code"
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: '500px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
                                    borderRadius: 4,
                                    bgcolor: '#ffffff',
                                    p: 2,
                                    border: '2px solid #e2e8f0'
                                }}
                            />
                        </Box>
                    </motion.div>
                </Grid>

                {/* Content Side */}
                <Grid item xs={12} md={7}>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.15, delayChildren: 0.2 }
                            }
                        }}
                    >
                        <motion.div variants={{ hidden: { x: 30, opacity: 0 }, visible: { x: 0, opacity: 1 } }}>
                            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 900, letterSpacing: '0.3em', display: 'block', mb: 1 }}>
                                UNIDADE E RESPEITO
                            </Typography>
                            <Typography variant="h2" fontWeight="900" sx={{
                                color: 'white',
                                mb: 3,
                                letterSpacing: '-0.04em',
                                fontSize: { xs: '2.5rem', md: '3.8rem' },
                                lineHeight: 1.1
                            }}>
                                O Padrão do Ministério
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#94a3b8', mb: 6, fontWeight: 500, fontStyle: 'italic', lineHeight: 1.6, maxWidth: 600 }}>
                                "A roupa não define a santidade, mas expressa o nosso respeito e reverência diante dos menores."
                            </Typography>
                        </motion.div>

                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={6}>
                                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                    <Box sx={{
                                        p: 4,
                                        background: '#ffffff',
                                        borderRadius: 6,
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <CheckIcon sx={{ mr: 1.5, fontSize: 32, color: '#166534' }} />
                                            <Typography variant="h6" fontWeight="900" sx={{ color: '#166534' }}>Permitido</Typography>
                                        </Box>
                                        <List dense disablePadding>
                                            {['Camisa do Ministério', 'Calça Jeans Folgada', 'Tênis ou Sapato Fechado', 'Higiene Impecável'].map((item, i) => (
                                                <ListItem key={i} sx={{ pl: 0, py: 1 }}>
                                                    <Box component="span" sx={{ color: '#0f172a', fontWeight: 600, mr: 1 }}>•</Box>
                                                    <Typography variant="body1" sx={{ color: '#334155', fontWeight: 500 }}>{item}</Typography>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                </motion.div>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                    <Box sx={{
                                        p: 5,
                                        background: '#ffffff',
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                                        height: '100%'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <CancelIcon sx={{ mr: 2, fontSize: 36, color: '#991b1b' }} />
                                            <Typography variant="h5" fontWeight="900" sx={{ color: '#991b1b', letterSpacing: '-0.02em' }}>Proibido</Typography>
                                        </Box>
                                        <List dense disablePadding>
                                            {[
                                                'Calças Coladas / Transparentes',
                                                'Decotes ou Roupas Curtas',
                                                'Cordões / Pulseiras Caras',
                                                'Adereços Espalhafatosos',
                                                'Chapéus / Acessórios de Cabeça',
                                                'Cuidado com Pinturas Exageradas'
                                            ].map((item, i) => (
                                                <ListItem key={i} sx={{ pl: 0, py: 1 }}>
                                                    <Box component="span" sx={{ color: '#0f172a', fontWeight: 600, mr: 1 }}>•</Box>
                                                    <Typography variant="body1" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.95rem' }}>{item}</Typography>
                                                </ListItem>
                                            ))}
                                        </List>
                                        <Box sx={{ mt: 3, p: 2, bgcolor: '#fff5f5', borderRadius: 2, borderLeft: '4px solid #991b1b' }}>
                                            <Typography variant="body2" sx={{ color: '#991b1b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Princípio Fundamental
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#b91c1c', fontWeight: 500, mt: 0.5, fontStyle: 'italic' }}>
                                                "Fuja da aparência do mal" — Você é porta-voz de Cristo.
                                            </Typography>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DressCodeSection;
