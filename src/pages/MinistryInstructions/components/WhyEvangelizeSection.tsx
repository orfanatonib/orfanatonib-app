import React from 'react';
import { Grid } from '@mui/material';
import StatisticsCard from './StatisticsCard';
import WhyEvangelizeData from './WhyEvangelizeData';

const WhyEvangelizeSection: React.FC = () => {
    return (
        <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatisticsCard
                        percentage="1%"
                        ageRange="Até 4 anos"
                        description="Taxa de conversão"
                        color="#9c27b0"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatisticsCard
                        percentage="85%"
                        ageRange="4 a 14 anos"
                        description="JANELA DE OPORTUNIDADE CRÍTICA!"
                        color="#f5576c"
                        delay={0.15}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatisticsCard
                        percentage="10%"
                        ageRange="15 a 30 anos"
                        description="Taxa de conversão"
                        color="#ff9800"
                        delay={0.3}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatisticsCard
                        percentage="4%"
                        ageRange="31+ anos"
                        description="Taxa de conversão"
                        color="#607d8b"
                        delay={0.45}
                    />
                </Grid>
            </Grid>
            <WhyEvangelizeData />
        </>
    );
};

export default WhyEvangelizeSection;
