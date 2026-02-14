import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
    Groups as GroupIcon,
    Campaign as CampaignIcon,
    Assignment as AssignmentIcon,
    Cake as CakeIcon,
    AttachMoney as MoneyIcon,
    DirectionsCar as CarIcon
} from '@mui/icons-material';
import InfoCard from './InfoCard';

const PlanningMeetingsSection: React.FC = () => {
    return (
        <>
            <InfoCard
                title="O que acontece no Planejamento"
                subtitle="Reunião preparatória mensal"
                color="#06b6d4"
                sections={[
                    {
                        icon: <GroupIcon />,
                        title: 'Organização Geral',
                        content: [
                            'Definição do lanche e divisão de responsabilidades',
                            'Distribuição de tarefas por setor',
                            'Alinhamento de horários e logística',
                            'Confirmação de presença de todos'
                        ]
                    },
                    {
                        icon: <CampaignIcon />,
                        title: 'Músicas e Coreografias',
                        content: [
                            'Ensaio das músicas temáticas',
                            'Prática das coreografias',
                            'Todos devem conhecer e saber executar',
                            'Divisão: meninos seguem homens, meninas seguem mulheres'
                        ]
                    },
                    {
                        icon: <AssignmentIcon />,
                        title: 'Materiais e Visuais',
                        content: [
                            'Cada pessoa deve trazer PRONTO e FINALIZADO',
                            'Visuais que serão usados na visita',
                            'Não deixe para a última hora!',
                            'Qualidade é importante - representa a Cristo'
                        ]
                    },
                    {
                        icon: <CakeIcon />,
                        title: 'Momentos Especiais',
                        content: [
                            'Em alguns encontros: comemoração de aniversariantes',
                            'Não há frustração se não for na data exata',
                            'Foco em comunhão e fortalecimento do grupo'
                        ]
                    },
                    {
                        icon: <MoneyIcon />,
                        title: 'Lanche da Reunião',
                        content: [
                            'Lanche facultativo - não gaste o que não pode',
                            'Se só puder ofertar uma vez: contribua no sábado',
                            'Priorize o lanche evangelístico da visita'
                        ]
                    },
                    {
                        icon: <CarIcon />,
                        title: 'Carona Amiga',
                        content: [
                            'Sempre oferecer carona amiga',
                            'Homem para homem, mulher para mulher',
                            'Planeje com antecedência',
                            'Ajude os irmãos que não têm transporte'
                        ]
                    }
                ]}
            />

            <Paper
                elevation={0}
                sx={{
                    mt: 6,
                    p: 4,
                    bgcolor: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.4s ease',
                    '&:hover': {
                        borderColor: '#e11d48',
                        boxShadow: '0 20px 40px rgba(225, 29, 72, 0.05)'
                    }
                }}
            >
                <Box sx={{
                    p: 2.5,
                    borderRadius: '20px',
                    bgcolor: '#e11d48',
                    color: 'white',
                    display: 'flex',
                    boxShadow: '0 10px 20px rgba(225, 29, 72, 0.2)'
                }}>
                    <Typography fontWeight="900" sx={{ fontSize: '1.4rem' }}>⚠️</Typography>
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight="900" sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Regra de Encerramento
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#475569', fontWeight: 500, lineHeight: 1.6 }}>
                        Só saímos das salas quando finalizar o <strong>"nada aconteceu"</strong>. Todos aguardam juntos.
                    </Typography>
                </Box>
            </Paper>
        </>
    );
};

export default PlanningMeetingsSection;
