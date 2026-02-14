import React from 'react';
import { Grid } from '@mui/material';
import QuoteBox from './QuoteBox';
import InfoCard from './InfoCard';

const CommitmentSection: React.FC = () => {
    return (
        <>
            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                    <QuoteBox
                        quote="Não há como falar de Deus sem buscar comunhão com Cristo"
                        reference="Princípio Fundamental"
                        color="#0891b2"
                        variant="light"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <InfoCard
                        title="Termo de Compromisso"
                        subtitle="Uma aliança com Cristo"
                        color="#00f2fe"
                        sections={[
                            {
                                title: 'O que é?',
                                content: [
                                    'Todos devem assinar um Termo de Compromisso',
                                    'Este compromisso é firmado COM CRISTO, não com a liderança',
                                    'Não é o líder quem "cobra": é uma oferta sua para Deus'
                                ]
                            },
                            {
                                title: 'Base Bíblica',
                                content: [
                                    'Referência: Josué 24:13-26',
                                    'Josué desafiou o povo a escolher a quem servir',
                                    'Um compromisso sério e consciente com o Senhor'
                                ]
                            }
                        ]}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <InfoCard
                        title="Compromissos Espirituais"
                        subtitle="Indispensáveis para participação"
                        color="#4facfe"
                        delay={0.15}
                        sections={[
                            {
                                title: 'Participação Obrigatória',
                                content: [
                                    'Culto (prioridade máxima)',
                                    'SENIB (Escola Bíblica)',
                                    'Reuniões do ministério'
                                ]
                            },
                            {
                                title: 'Meditação e Oração',
                                content: [
                                    'Busca diária de comunhão com Deus',
                                    'Tempo pessoal de meditação na Palavra',
                                    'Vida de oração ativa'
                                ]
                            }
                        ]}
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default CommitmentSection;
