import React from 'react';
import { Box, Typography } from '@mui/material';

const DressCodeIntro: React.FC = () => {
    return (
        <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight="900" gutterBottom>
                3. Padrões e Vestimenta
            </Typography>
            <Typography variant="h6" color="text.secondary">
                Unidade de padrão - Todos seguem o mesmo padrão de conduta
            </Typography>
        </Box>
    );
};

export default DressCodeIntro;
