import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    Church as ChurchIcon,
    Groups as GroupsIcon,
    MenuBook as BookIcon,
    VolunteerActivism as VolunteerIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const PriorityLadder: React.FC = () => {
    const priorities = [
        {
            id: 1,
            label: "Culto Domingo",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            icon: ChurchIcon,
            badgeColor: "#667eea"
        },
        {
            id: 2,
            label: "Culto Jovens",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            icon: GroupsIcon,
            badgeColor: "#f5576c"
        },
        {
            id: 3,
            label: "SENIB",
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            icon: BookIcon,
            badgeColor: "#00f2fe"
        },
        {
            id: 4,
            label: "Ministérios",
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            icon: VolunteerIcon,
            badgeColor: "#38f9d7"
        },
    ];

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
            {priorities.map((item, index) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={item.id}
                        initial={{ x: -100, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.15 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 2.5, md: 3 },
                                mb: 1,
                                background: item.gradient,
                                color: 'white',
                                borderRadius: 3,
                                position: 'relative',
                                zIndex: priorities.length - index,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: { xs: 'translateY(-3px) scale(1.01)', md: 'translateY(-5px) scale(1.02)' },
                                    boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                                {/* Number Badge */}
                                <Box sx={{
                                    width: { xs: 40, sm: 42, md: 45 },
                                    height: { xs: 40, sm: 42, md: 45 },
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.3)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    flexShrink: 0
                                }}>
                                    {item.id}º
                                </Box>

                                {/* Icon */}
                                <Icon sx={{
                                    fontSize: { xs: 28, sm: 32, md: 35 },
                                    opacity: 0.9,
                                    flexShrink: 0,
                                    display: { xs: 'none', sm: 'block' }
                                }} />

                                {/* Label */}
                                <Typography
                                    variant="h6"
                                    fontWeight="700"
                                    sx={{
                                        flex: 1,
                                        textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                        fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Connector */}
                        {index < priorities.length - 1 && (
                            <motion.div
                                initial={{ scaleY: 0 }}
                                whileInView={{ scaleY: 1 }}
                                viewport={{ once: false }}
                                transition={{ delay: index * 0.15 + 0.3, duration: 0.3 }}
                                style={{
                                    height: 25,
                                    borderLeft: `3px solid ${item.badgeColor}`,
                                    marginLeft: window.innerWidth < 600 ? 20 : 22,
                                    marginBottom: 4,
                                    opacity: 0.6,
                                    transformOrigin: 'top'
                                }}
                            />
                        )}
                    </motion.div>
                );
            })}
        </Box>
    );
};

export default PriorityLadder;
