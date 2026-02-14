import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { AttachMoney as MoneyIcon, Favorite as HeartIcon, Campaign as CampaignIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import QuoteBox from './QuoteBox';

const FinancialSection: React.FC = () => {
    return (
        <Grid container spacing={4}>
            <Grid item xs={12}>
                <QuoteBox
                    quote="Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria. E Deus é poderoso para fazer que lhes seja acrescentada toda a graça"
                    reference="2 Coríntios 9:6-11"
                    color="#e11d48"
                    variant="light"
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            borderRadius: 8,
                            height: '100%',
                            textAlign: 'center',
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: 'translateY(-12px)',
                                boxShadow: '0 30px 60px rgba(15, 23, 42, 0.08)',
                                borderColor: 'currentColor'
                            }
                        }}
                    >
                        <MoneyIcon sx={{ fontSize: 60, color: '#e11d48', mb: 3 }} />
                        <Typography variant="h6" fontWeight="900" gutterBottom color="#0f172a" sx={{ letterSpacing: '-0.01em' }}>
                            Não comprometa além
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7 }}>
                            Não se comprometa a dar além do que o Senhor possibilita. Seja sábio em suas decisões financeiras.
                        </Typography>
                    </Paper>
                </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            borderRadius: 8,
                            height: '100%',
                            textAlign: 'center',
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
                                borderColor: '#eab308'
                            }
                        }}
                    >
                        <HeartIcon sx={{ fontSize: 60, color: '#eab308', mb: 3 }} />
                        <Typography variant="h6" fontWeight="900" gutterBottom color="#0f172a" sx={{ letterSpacing: '-0.01em' }}>
                            Dê com alegria
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7 }}>
                            Seja transparente com seu cônjuge e dê com alegria, não por obrigação ou pressão.
                        </Typography>
                    </Paper>
                </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            borderRadius: 8,
                            height: '100%',
                            textAlign: 'center',
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: 'translateY(-12px)',
                                boxShadow: '0 30px 60px rgba(15, 23, 42, 0.08)',
                                borderColor: 'currentColor'
                            }
                        }}
                    >
                        <CampaignIcon sx={{ fontSize: 60, color: '#e11d48', mb: 3 }} />
                        <Typography variant="h6" fontWeight="900" gutterBottom color="#0f172a" sx={{ letterSpacing: '-0.01em' }}>
                            Nem a menos por descuido
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.7 }}>
                            Honre seus compromissos assumidos, mas sempre dentro do que Deus provê.
                        </Typography>
                    </Paper>
                </motion.div>
            </Grid>
        </Grid>
    );
};

export default FinancialSection;
