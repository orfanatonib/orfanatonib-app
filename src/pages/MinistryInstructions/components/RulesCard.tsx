import React from 'react';
import { Box, Paper, Typography, List, ListItem } from '@mui/material';
import { CheckCircle as CheckIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface RulesCardProps {
    title: string;
    items: string[];
    type: 'allowed' | 'prohibited';
    delay?: number;
}

const RulesCard: React.FC<RulesCardProps> = ({ title, items, type, delay = 0 }) => {
    const isAllowed = type === 'allowed';
    const Icon = isAllowed ? CheckIcon : CancelIcon;
    const color = isAllowed ? '#22c55e' : '#ef4444'; // Vibrant Green/Red

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%' }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, md: 4 },
                    height: '100%',
                    bgcolor: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                    '&:hover': {
                        transform: 'translateY(-8px)',
                        borderColor: color,
                        boxShadow: `0 30px 60px rgba(0,0,0,0.08)`
                    },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '4px',
                        height: '100%',
                        background: color,
                        boxShadow: `0 0 15px ${color}33`
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: '12px',
                        bgcolor: `${color}15`,
                        display: 'flex',
                        mr: 2
                    }}>
                        <Icon sx={{ fontSize: 26, color }} />
                    </Box>
                    <Typography
                        variant="h6"
                        fontWeight="900"
                        sx={{
                            fontSize: '1.25rem',
                            color: '#0f172a',
                            letterSpacing: '-0.02em'
                        }}
                    >
                        {title}
                    </Typography>
                </Box>
                <List dense disablePadding>
                    {items.map((item, index) => (
                        <ListItem key={index} sx={{ pl: 0, py: 0.8, alignItems: 'flex-start' }}>
                            <Box sx={{
                                mt: '6px',
                                mr: 1.5,
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                bgcolor: color,
                                flexShrink: 0
                            }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    fontSize: '1rem',
                                    color: '#475569',
                                    lineHeight: 1.6,
                                    fontWeight: 500
                                }}
                            >
                                {item}
                            </Typography>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </motion.div>
    );
};

export default RulesCard;
