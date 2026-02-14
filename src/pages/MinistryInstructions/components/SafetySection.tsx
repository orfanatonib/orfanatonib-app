import React from 'react';
import { Grid } from '@mui/material';
import RulesCard from './RulesCard';
import SafetyGoldenRule from './SafetyGoldenRule';

const SafetySection: React.FC = () => {
    return (
        <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <RulesCard
                        title="Proibido para Homens"
                        type="prohibited"
                        items={[
                            'Dar colo',
                            'Levar ao banheiro',
                            'Ficar a sós com criança de qualquer idade',
                            'Ficar a sós com criança de qualquer sexo'
                        ]}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RulesCard
                        title="Linguagem Adequada"
                        type="prohibited"
                        items={[
                            'Nunca usar "Pai" ou "Tio"',
                            'Evitar "paizinho", "deuzinho"',
                            'Evitar "pessoinha", "criancinha"',
                            'Evitar "amiguinho" e diminutivos',
                            'Não infantilizar a reverência'
                        ]}
                        delay={0.15}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <RulesCard
                        title="Regra de Interação"
                        type="allowed"
                        items={[
                            'Homem conversa com homem',
                            'Mulher conversa com mulher',
                            'Sempre em ambientes visíveis',
                            'Nunca em espaços isolados'
                        ]}
                        delay={0.3}
                    />
                </Grid>
            </Grid>
            <SafetyGoldenRule />
        </>
    );
};

export default SafetySection;
