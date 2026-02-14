import React from 'react';
import { Box, Avatar } from '@mui/material';

interface IconBadgeProps {
    icon: React.ReactNode;
    color: string;
    size?: number;
}

const IconBadge: React.FC<IconBadgeProps> = ({ icon, color, size = 60 }) => {
    // Responsive sizing
    const responsiveSize = { xs: size * 0.7, sm: size * 0.85, md: size };

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'inline-flex',
                mb: 2
            }}
        >
            <Avatar
                sx={{
                    width: responsiveSize,
                    height: responsiveSize,
                    bgcolor: color,
                    boxShadow: `0 8px 25px ${color}50`,
                    '& > svg': {
                        fontSize: { xs: size * 0.5, sm: size * 0.6, md: size * 0.7 }
                    }
                }}
            >
                {icon}
            </Avatar>
            <Box
                sx={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    width: { xs: size * 0.7 + 10, sm: size * 0.85 + 10, md: size + 10 },
                    height: { xs: size * 0.7 + 10, sm: size * 0.85 + 10, md: size + 10 },
                    borderRadius: '50%',
                    border: `3px solid ${color}30`,
                    animation: 'pulse 2s infinite'
                }}
            />
            <style>
                {`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.5; }
                        50% { transform: scale(1.1); opacity: 0.2; }
                    }
                `}
            </style>
        </Box>
    );
};

export default IconBadge;
