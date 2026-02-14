import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface CommitmentCardProps {
    title: string;
    icon: React.ElementType;
    color: string;
    children: React.ReactNode;
    delay: number;
}

const CommitmentCard: React.FC<CommitmentCardProps> = ({ title, icon: Icon, color, children, delay }) => {
    return (
        <motion.div
            initial={{ rotateX: 90, opacity: 0 }}
            whileInView={{ rotateX: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay, type: "spring", bounce: 0.4 }}
        >
            <Paper elevation={0} sx={{
                p: 3,
                height: '100%',
                bgcolor: `${color}08`,
                borderLeft: `4px solid ${color}`,
                borderRadius: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Icon sx={{ color: color, mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    {children}
                </Typography>
            </Paper>
        </motion.div>
    );
};

export default CommitmentCard;
