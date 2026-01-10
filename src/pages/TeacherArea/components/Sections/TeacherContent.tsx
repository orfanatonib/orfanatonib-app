import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, useMediaQuery, useTheme, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TeacherContentProps } from '../../types';
import { SECTION_DATA } from '../../constants';
import { DocumentsSection, IdeasGallerySection, TrainingVideosSection, CommentsSection } from './';

const TeacherContent: React.FC<TeacherContentProps> = ({ userName }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleCardToggle = (index: number) => {
    if (isMobile) {
      setExpandedCard(expandedCard === index ? null : index);
    }
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Box
          textAlign="center"
          mb={{ xs: 3, md: 5 }}
          sx={{
            p: { xs: 2, sm: 3, md: 5 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(33, 150, 243, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(33, 150, 243, 0.1)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 150,
              height: 150,
              background: 'radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -20,
              left: -20,
              width: 120,
              height: 120,
              background: 'radial-gradient(circle, rgba(76, 175, 80, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0,
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Typography
                variant="h3"
                fontWeight={900}
                gutterBottom
                sx={{
                  fontSize: { xs: '1.3rem', sm: '1.5rem', md: '2.2rem' },
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 50%, #1976d2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                  mb: { xs: 1.5, md: 2.5 },
                }}
              >
                Olá, {userName || 'Membro'}!
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Typography
                variant="h6"
                color="text.primary"
                sx={{
                  maxWidth: '900px',
                  mx: 'auto',
                  fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.4rem' },
                  lineHeight: { xs: 1.5, md: 1.8 },
                  fontWeight: 600,
                  letterSpacing: '0.2px',
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                Bem-vindo ao site do Abrigo onde consegue encontrar materiais, ideias e recursos para enriquecer suas aulas!
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: '800px',
                  mx: 'auto',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.15rem' },
                  lineHeight: { xs: 1.5, md: 1.7 },
                  fontWeight: 500,
                  letterSpacing: '0.1px',
                }}
              >
                Tudo atualizado semanalmente e alinhado ao calendário bíblico para sua missão evangelística!
              </Typography>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Grid container spacing={3} sx={{ mt: 5 }}>
        {SECTION_DATA.map((section, idx) => {
          const IconComponent = section.icon === 'CheckCircle' ? CheckCircleIcon :
            section.icon === 'Info' ? InfoIcon : LightbulbIcon;

          const isExpanded = expandedCard === idx;
          const isCompressed = isMobile && !isExpanded;

          return (
            <Grid key={idx} item xs={12} sm={6} md={4}>
              <motion.div
                whileHover={{ scale: isMobile ? 1 : 1.05, y: isMobile ? 0 : -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  elevation={6}
                  sx={{
                    height: isCompressed ? 'auto' : '100%',
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
                    border: `2px solid ${section.color}20`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: isMobile ? 'pointer' : 'default',
                    '&:hover': {
                      elevation: 12,
                      borderColor: section.color,
                      boxShadow: `0 20px 40px ${section.color}20`,
                    },
                  }}
                  onClick={() => handleCardToggle(idx)}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      background: `${section.color}10`,
                      borderRadius: '50%',
                      zIndex: 0,
                    }}
                  />

                  <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 1.5, md: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={isCompressed ? 0 : 1.5}>
                      <Box display="flex" alignItems="center" flex={1}>
                        <Box
                          sx={{
                            p: 0.8,
                            borderRadius: 1.5,
                            bgcolor: `${section.color}20`,
                            color: section.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1,
                          }}
                        >
                          <IconComponent sx={{ fontSize: { xs: '1rem', md: '1.2rem' } }} />
                        </Box>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{
                            color: 'text.primary',
                            fontSize: { xs: '0.85rem', md: '0.95rem' },
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          }}
                        >
                          {section.title}
                        </Typography>
                      </Box>

                      {isMobile && (
                        <IconButton
                          size="small"
                          sx={{
                            color: section.color,
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      )}
                    </Box>

                    <AnimatePresence>
                      {(!isMobile || isExpanded) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <Box component="ul" sx={{ pl: 0, m: 0, listStyle: 'none', mt: 1 }}>
                            {section.items.map((item: string, idy: number) => (
                              <Box
                                key={idy}
                                component="li"
                                sx={{
                                  mb: 1,
                                  p: { xs: 0.8, md: 1 },
                                  borderRadius: 1.5,
                                  background: 'rgba(255,255,255,0.7)',
                                  borderLeft: `2px solid ${section.color}`,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    background: 'rgba(255,255,255,1)',
                                    transform: 'translateX(3px)',
                                  },
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'text.primary',
                                    fontSize: { xs: '0.75rem', md: '0.8rem' },
                                    lineHeight: { xs: 1.3, md: 1.4 },
                                    fontWeight: 500,
                                    letterSpacing: '0.05px',
                                  }}
                                >
                                  {item}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
        </Grid>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Box mt={8}>
          <DocumentsSection />
        </Box>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Box mt={8}>
          <IdeasGallerySection />
        </Box>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box mt={8}>
          <TrainingVideosSection />
        </Box>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Box mt={8} mb={4}>
          <CommentsSection />
        </Box>
      </motion.div>
    </Box>
  );
};

export default TeacherContent;
