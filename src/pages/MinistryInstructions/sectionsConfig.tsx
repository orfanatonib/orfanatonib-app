import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    Divider,
    Box,
    Chip,
    List,
    ListItem,
    Card,
    CardContent
} from '@mui/material';
import {
    EmojiPeople as PeopleIcon,
    Favorite as HeartIcon,
    Campaign as CampaignIcon,
    Shield as ShieldIcon,
    Event as EventIcon,
    Phone as PhoneIcon,
    Assignment as AssignmentIcon,
    AttachMoney as MoneyIcon,
    Group as GroupIcon,
    WatchLater as TimeIcon,
    Cake as CakeIcon,
    DirectionsCar as CarIcon,
    ChildCare as ChildIcon,
    EmojiPeople as TeenIcon,
    Elderly as AdultIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Component Imports
import StatisticsCard from './components/StatisticsCard';
import RulesCard from './components/RulesCard';
import DressCodeSection from './components/DressCodeSection';
import PriorityLadder from './components/PriorityLadder';
import VisitTimeline from './components/VisitTimeline';
import ChecklistSection from './components/ChecklistSection';
import QuoteBox from './components/QuoteBox';
import InfoCard from './components/InfoCard';
import IconBadge from './components/IconBadge';

// Section Configuration Interface
export interface SectionConfig {
    id?: string;
    title: string;
    subtitle: string;
    gradient: string;
    zIndex: number;
    bottomDividerColor?: string;
    topDivider?: 'none' | 'curve';
    bottomDivider?: 'none' | 'curve';
}

// Content Rendering Functions
export const renderIdentityContent = () => (
    <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6 }}
            >
                <Paper sx={{ p: 4, borderRadius: 4, height: '100%', textAlign: 'center' }}>
                    <IconBadge icon={<PeopleIcon sx={{ fontSize: 35 }} />} color="#667eea" />
                    <Typography variant="h5" fontWeight="800" gutterBottom>
                        Quem Somos
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Resposta de oração
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        "Por isso, orai ao Senhor da seara e pedi que Ele mande mais trabalhadores para a sua colheita."
                    </Typography>
                    <Chip label="Mateus 9:38" size="small" sx={{ mt: 1, bgcolor: '#667eea20' }} />
                </Paper>
            </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.15 }}
            >
                <Paper sx={{ p: 4, borderRadius: 4, height: '100%', textAlign: 'center' }}>
                    <IconBadge icon={<CampaignIcon sx={{ fontSize: 35 }} />} color="#764ba2" />
                    <Typography variant="h5" fontWeight="800" gutterBottom>
                        Nosso Foco
                    </Typography>
                    <Box sx={{
                        display: 'inline-block',
                        mt: 2,
                        p: 3,
                        bgcolor: '#764ba215',
                        borderRadius: 3
                    }}>
                        <Typography variant="h4" fontWeight="900" color="#764ba2">
                            E
                        </Typography>
                        <Typography variant="h6" fontWeight="700" color="#764ba2">
                            EVANGELIZAR
                        </Typography>
                    </Box>
                </Paper>
            </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <Paper sx={{ p: 4, borderRadius: 4, height: '100%', textAlign: 'center' }}>
                    <IconBadge icon={<HeartIcon sx={{ fontSize: 35 }} />} color="#f5576c" />
                    <Typography variant="h5" fontWeight="800" gutterBottom>
                        Nossa Missão
                    </Typography>
                    <Box sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: '#f5576c15',
                        borderRadius: 2
                    }}>
                        <Typography variant="h6" fontWeight="700" color="#f5576c">
                            Evangelizar nos Abrigos
                        </Typography>
                    </Box>
                </Paper>
            </motion.div>
        </Grid>
    </Grid>
);

export const renderWhyEvangelizeContent = () => (
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
                    ageRange="4-14 anos"
                    description="Mais receptíveis"
                    color="#2196f3"
                    delay={0.1}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatisticsCard
                    percentage="10%"
                    ageRange="15-30 anos"
                    description="Adolescentes/Jovens"
                    color="#ff9800"
                    delay={0.2}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatisticsCard
                    percentage="4%"
                    ageRange="Acima de 30"
                    description="Adultos"
                    color="#4caf50"
                    delay={0.3}
                />
            </Grid>
        </Grid>
        <QuoteBox
            quote="Deixai vir a mim as crianças e não as impeçais, porque o Reino de Deus pertence aos que são semelhantes a elas."
            reference="Lucas 18:16"
            color="#f093fb"
        />
    </>
);

// Helper function to create more rendering functions
// This file will be extended with all 13 section content renderers
