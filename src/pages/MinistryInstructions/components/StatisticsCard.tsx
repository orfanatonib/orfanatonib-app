import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface StatisticsCardProps {
    percentage: string;
    ageRange: string;
    description: string;
    color: string;
    delay?: number;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
    percentage,
    ageRange,
    description,
    color,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, sm: 3, md: 4 },
                    height: '100%',
                    background: 'white',
                    borderRadius: 3,
                    textAlign: 'center',
                    border: { xs: `2px solid ${color}`, md: `3px solid ${color}` },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: { xs: 'translateY(-5px)', md: 'translateY(-10px)' },
                        boxShadow: `0 15px 40px ${color}40`
                    }
                }}
            >
                <Typography
                    variant="h2"
                    fontWeight="900"
                    sx={{
                        color,
                        mb: 1,
                        fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' }
                    }}
                >
                    {percentage}
                </Typography>
                <Typography
                    variant="h6"
                    fontWeight="700"
                    sx={{
                        mb: 2,
                        color: 'text.primary',
                        fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
                    }}
                >
                    {ageRange}
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        lineHeight: 1.6,
                        fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }
                    }}
                >
                    {description}
                </Typography>
            </Paper>
        </motion.div>
    );
};

export default StatisticsCard;
