import React from 'react';
import { Grid } from '@mui/material';
import FrequencyWarning from './FrequencyWarning';
import InfoCard from './InfoCard';

const FrequencySection: React.FC = () => {
    return (
        <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
                <FrequencyWarning />
            </Grid>
            <Grid item xs={12} md={6}>
                <InfoCard
                    title="Organização Pessoal"
                    subtitle="Planeje-se com antecedência"
                    color="#43e97b"
                    delay={0.15}
                    variant="glass"
                    sections={[
                        {
                            title: 'Você receberá',
                            content: [
                                'Calendário completo com antecedência',
                                'Horários de todas as atividades',
                                'Informações sobre cada visita',
                                'ORGANIZE-SE!'
                            ]
                        },
                        {
                            title: 'Reflexão Espiritual',
                            content: [
                                'Às vezes seguimos "nosso próprio caminho"',
                                'Mas Deus é quem determina nossos passos',
                                'Exemplo: Ló e Abraão - decisões pelo "que os olhos veem"',
                                'Pergunta: "Eu tenho permissão de Deus para estar aqui?"'
                            ]
                        }
                    ]}
                />
            </Grid>
        </Grid>
    );
};

export default FrequencySection;
