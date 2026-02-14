import React from 'react';
import { Paper, Box, Avatar, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface SpiritualPrincipleCardProps {
    icon: React.ElementType;
    title: string;
    content: string;
    delay: number;
    color: string;
}

const SpiritualPrincipleCard: React.FC<SpiritualPrincipleCardProps> = ({ icon: Icon, title, content, delay, color }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 12px 40px ${color}33`
                    }
                }}
            >
                <Box sx={{
                    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                    borderRadius: '50%', bgcolor: `${color}11`, zIndex: 0
                }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
                    <Avatar sx={{ bgcolor: `${color}22`, color: color, mr: 2 }}>
                        <Icon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                        {title}
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', zIndex: 1, lineHeight: 1.6 }}>
                    {content}
                </Typography>
            </Paper>
        </motion.div>
    );
};

export default SpiritualPrincipleCard;
