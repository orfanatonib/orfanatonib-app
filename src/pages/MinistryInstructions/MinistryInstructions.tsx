import React from 'react';
import { Box, Container, GlobalStyles, Typography } from '@mui/material';
import { motion } from 'framer-motion';

import ScrollToTop from './components/ScrollToTop';
import HeroSection from './components/HeroSection';
import SectionContainer from './components/SectionContainer';
import IdentitySection from './components/IdentitySection';
import WhyEvangelizeSection from './components/WhyEvangelizeSection';
import CommitmentSection from './components/CommitmentSection';
import FrequencySection from './components/FrequencySection';
import SafetySection from './components/SafetySection';
import LimitsSection from './components/LimitsSection';
import FinancialSection from './components/FinancialSection';
import CommunicationSection from './components/CommunicationSection';
import AdministrativeSection from './components/AdministrativeSection';
import PrioritiesSection from './components/PrioritiesSection';
import PlanningMeetingsSection from './components/PlanningMeetingsSection';
import VisitDaySection from './components/VisitDaySection';
import ShelterSectorsSection from './components/ShelterSectorsSection';
import VisitTimeline from './components/VisitTimeline';
import ChecklistSection from './components/ChecklistSection';
import QuoteBox from './components/QuoteBox';
import DressCodeSection from './components/DressCodeSection';

const DESIGN_THEME = {
    fonts: {
        primary: '"Outfit", sans-serif',
    },
    colors: {
        primary: '#4f46e5',
        secondary: '#e11d48',
        accent: '#0891b2',
        background: '#ffffff',
        textDark: '#0f172a',
        textMuted: '#475569',
        glass: 'rgba(255, 255, 255, 0.65)',
    },
    gradients: {
        indigoRose: 'linear-gradient(135deg, #4f46e5 0%, #e11d48 100%)',
        tealIndigo: 'linear-gradient(135deg, #0d9488 0%, #4f46e5 100%)',
        slateIndigo: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)',
        deepBlue: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    }
};

const MinistryInstructions: React.FC = () => {

    return (
        <Box sx={{
            bgcolor: DESIGN_THEME.colors.background,
            minHeight: '100vh',
            overflowX: 'hidden',
            fontFamily: DESIGN_THEME.fonts.primary
        }}>
            <GlobalStyles styles={`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                * { font-family: ${DESIGN_THEME.fonts.primary} !important; }
            `} />

            <ScrollToTop />
            <HeroSection />

            <SectionContainer
                id="identity"
                title="Identidade do Ministério"
                subtitle="Todos que chegam ao ministério são resposta de oração"
                gradient={DESIGN_THEME.gradients.indigoRose}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#f43f5e"
                zIndex={20}
            >
                <IdentitySection />
            </SectionContainer>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <Box id="why-evangelize" sx={{
                    pb: 5,
                    pt: 16,
                    bgcolor: '#ffffff', position: 'relative', zIndex: 19
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3.75rem' } }}>
                                Por que Evangelizar Crianças?
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 300, maxWidth: 800, mx: 'auto' }}>
                                Dados da APEC (Aliança Pró Evangelização de Crianças)
                            </Typography>
                        </Box>
                        <WhyEvangelizeSection />
                    </Container>
                </Box>
            </motion.div>

            <SectionContainer
                id="dress-code"
                title="Padrões e Vestimenta"
                subtitle="Unidade de padrão - Todos seguem o mesmo padrão de conduta"
                gradient={DESIGN_THEME.gradients.tealIndigo}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#6366f1"
                zIndex={18}
            >
                <DressCodeSection />
            </SectionContainer>

            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.1 }}
            >
                <Box id="commitment" sx={{
                    pb: 5,
                    pt: 16,
                    bgcolor: '#ffffff', position: 'relative', zIndex: 17
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3.75rem' } }}>
                                Compromisso e Vida Espiritual
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 300, maxWidth: 800, mx: 'auto' }}>
                                Nossa eficácia externa depende da nossa vida interna com Deus.
                            </Typography>
                        </Box>
                        <CommitmentSection />
                    </Container>
                </Box>
            </motion.div>

            <SectionContainer
                id="frequency"
                title="Frequência e Organização"
                subtitle="O ministério não é 'ir quando der' - Exige organização"
                gradient={DESIGN_THEME.gradients.indigoRose}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#f43f5e"
                zIndex={16}
            >
                <FrequencySection />
            </SectionContainer>

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <Box id="safety" sx={{
                    pb: 5,
                    pt: 16,
                    bgcolor: '#ffffff', position: 'relative', zIndex: 15
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3.75rem' } }}>
                                Segurança e Conduta
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 300, maxWidth: 800, mx: 'auto' }}>
                                Regras INEGOCIÁVEIS para proteção de todos.
                            </Typography>
                        </Box>
                        <SafetySection />
                    </Container>
                </Box>
            </motion.div>

            <SectionContainer
                id="limits"
                title="Limites do Ministério"
                subtitle="O que NÃO fazemos - Foco em Evangelização"
                gradient={DESIGN_THEME.gradients.slateIndigo}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#6366f1"
                zIndex={14}
            >
                <LimitsSection />
            </SectionContainer>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <Box id="financial" sx={{
                    pb: 5,
                    pt: 16,
                    bgcolor: '#ffffff', position: 'relative', zIndex: 13
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3.75rem' } }}>
                                Organização Financeira
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 300, maxWidth: 800, mx: 'auto' }}>
                                Transparência e cuidado com os recursos.
                            </Typography>
                        </Box>
                        <FinancialSection />
                    </Container>
                </Box>
            </motion.div>

            <SectionContainer
                id="communication"
                title="Comunicação Oficial"
                subtitle="Grupos de WhatsApp - Uso adequado e respeitoso"
                gradient={DESIGN_THEME.gradients.tealIndigo}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#6366f1"
                zIndex={12}
            >
                <CommunicationSection />
            </SectionContainer>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <Box id="administrative" sx={{
                    pb: 5,
                    pt: 16,
                    bgcolor: '#ffffff', position: 'relative', zIndex: 11
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.2rem' } }}>
                                Administrativo e Segurança
                            </Typography>
                        </Box>
                        <AdministrativeSection />
                    </Container>
                </Box>
            </motion.div>

            <SectionContainer
                id="priorities"
                title="Hierarquia de Prioridades"
                subtitle="Deus primeiro, Ministério com Excelência"
                gradient={DESIGN_THEME.gradients.indigoRose}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#f43f5e"
                zIndex={10}
            >
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3 }}
                >
                    <PrioritiesSection />
                </motion.div>
            </SectionContainer>

            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <Box id="planning-meetings" sx={{
                    pb: 5,
                    pt: 16,
                    bgcolor: '#ffffff', position: 'relative', zIndex: 9
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3.75rem' } }}>
                                Encontros de Planejamento
                            </Typography>
                        </Box>
                        <PlanningMeetingsSection />
                    </Container>
                </Box>
            </motion.div>

            <SectionContainer
                id="visit-day"
                title="No Dia da Visita"
                subtitle="Procedimentos e regras para o dia"
                gradient={DESIGN_THEME.gradients.tealIndigo}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#6366f1"
                zIndex={8}
            >
                <VisitDaySection />
            </SectionContainer>

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <Box id="shelter-sectors" sx={{
                    pb: 5,
                    pt: 16,
                    bgcolor: '#ffffff', position: 'relative', zIndex: 7
                }}>
                    <Container maxWidth="lg">
                        <Box sx={{ textAlign: 'center', mb: 10 }}>
                            <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3.75rem' } }}>
                                Setores do Abrigo
                            </Typography>
                        </Box>
                        <ShelterSectorsSection />
                    </Container>
                </Box>
            </motion.div>

            <SectionContainer
                id="visit-structure"
                title="Roteiro Padrão da Visita"
                subtitle="Estrutura essencial de 6 momentos"
                gradient={DESIGN_THEME.gradients.indigoRose}
                topDivider="none"
                bottomDivider="curve"
                bottomDividerColor="#f43f5e"
                zIndex={6}
            >
                <VisitTimeline />
            </SectionContainer>

            <Box id="checklist" sx={{
                pb: 5,
                pt: 16,
                bgcolor: '#ffffff',
                position: 'relative', zIndex: 5
            }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 10 }}>
                        <Typography variant="h2" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.04em', mb: 2, fontSize: { xs: '1.5rem', sm: '2.2rem', md: '3.75rem' } }}>
                            Checklist do Membro
                        </Typography>
                    </Box>
                    <ChecklistSection />
                </Container>
            </Box>

            <Box sx={{
                bgcolor: '#ffffff',
                pb: 5,
                pt: 0,
            }}>
                <Container maxWidth="md">
                    <QuoteBox
                        quote="Se tiver que optar, escolha sempre o Culto. O Ministério exige organização, não é 'quando der'."
                        reference="Princípio de Prioridade"
                        color={DESIGN_THEME.colors.primary}
                        variant="light"
                    />
                </Container>
            </Box>

        </Box>
    );
};

export default MinistryInstructions;

