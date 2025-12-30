import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  PlaceOutlined,
  LocationCityOutlined,
  MapOutlined,
  LocalPostOfficeOutlined,
  PersonOutline,
  SchoolOutlined,
  GroupOutlined,
  HomeOutlined,
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiFetchShelter } from '@/features/shelters/api';
import { ShelterResponseDto } from '@/features/shelters/types';
import { fmtDate } from '@/utils/dates';
import { RootState } from '@/store/slices';

interface ShelterPageViewProps {
  idToFetch: string;
}

export default function ShelterPageView({ idToFetch }: ShelterPageViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loadingUser, initialized } = useSelector((state: RootState) => state.auth);
  const [shelter, setShelter] = useState<ShelterResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadersScrollRef, setLeadersScrollRef] = useState<HTMLDivElement | null>(null);
  const [teachersScrollRef, setTeachersScrollRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialized && !loadingUser && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, loadingUser, initialized, navigate, location]);

  useEffect(() => {
    const fetchShelter = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetchShelter(idToFetch);
        setShelter(data);
      } catch (err: any) {
        console.error('Error loading shelter:', err);
        setError(err?.response?.data?.message || 'Erro ao carregar o abrigo. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (idToFetch) {
      fetchShelter();
    }
  }, [idToFetch]);

  const uniqueLeaders = useMemo(() => {
    if (!shelter?.teams || shelter.teams.length === 0) return [];
    const leadersMap = new Map<string, (typeof shelter.teams)[0]['leaders'][0]>();
    shelter.teams.forEach((team) => {
      if (team.leaders && team.leaders.length > 0) {
        team.leaders.forEach((leader) => {
          const leaderId = leader.id;
          if (!leadersMap.has(leaderId)) {
            leadersMap.set(leaderId, leader);
          }
        });
      }
    });
    return Array.from(leadersMap.values());
  }, [shelter?.teams]);

  const uniqueTeachers = useMemo(() => {
    if (!shelter?.teams || shelter.teams.length === 0) return [];
    const teachersMap = new Map<string, (typeof shelter.teams)[0]['teachers'][0]>();
    shelter.teams.forEach((team) => {
      if (team.teachers && team.teachers.length > 0) {
        team.teachers.forEach((teacher) => {
          const teacherId = teacher.id;
          if (!teachersMap.has(teacherId)) {
            teachersMap.set(teacherId, teacher);
          }
        });
      }
    });
    return Array.from(teachersMap.values());
  }, [shelter?.teams]);

  const getLeaderTeams = useMemo(() => {
    const teamsMap = new Map<string, number[]>();
    if (shelter?.teams && shelter.teams.length > 0) {
      shelter.teams.forEach((team) => {
        if (team.leaders && team.leaders.length > 0) {
          team.leaders.forEach((teamLeader) => {
            const leaderId = teamLeader.id;
            if (!teamsMap.has(leaderId)) {
              teamsMap.set(leaderId, []);
            }
            const currentTeams = teamsMap.get(leaderId) || [];
            if (!currentTeams.includes(team.numberTeam)) {
              currentTeams.push(team.numberTeam);
              teamsMap.set(leaderId, currentTeams);
            }
          });
        }
      });
    }
    return (leaderId: string) => {
      const teams = teamsMap.get(leaderId) || [];
      return teams.sort((a, b) => a - b);
    };
  }, [shelter?.teams]);

  const getTeacherTeams = useMemo(() => {
    const teamsMap = new Map<string, number[]>();
    if (shelter?.teams && shelter.teams.length > 0) {
      shelter.teams.forEach((team) => {
        if (team.teachers && team.teachers.length > 0) {
          team.teachers.forEach((teamTeacher) => {
            const teacherId = teamTeacher.id;
            if (!teamsMap.has(teacherId)) {
              teamsMap.set(teacherId, []);
            }
            const currentTeams = teamsMap.get(teacherId) || [];
            if (!currentTeams.includes(team.numberTeam)) {
              currentTeams.push(team.numberTeam);
              teamsMap.set(teacherId, currentTeams);
            }
          });
        }
      });
    }
    return (teacherId: string) => {
      const teams = teamsMap.get(teacherId) || [];
      return teams.sort((a, b) => a - b);
    };
  }, [shelter?.teams]);

  const scrollLeaders = (direction: 'left' | 'right') => {
    if (leadersScrollRef) {
      const container = leadersScrollRef;
      const cardWidth = 280; // Largura do card
      const gap = 16; // Gap entre cards
      const scrollAmount = cardWidth + gap;
      const currentScroll = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      let targetScroll: number;
      if (direction === 'left') {
        const targetPosition = currentScroll - scrollAmount;
        targetScroll = Math.max(0, targetPosition);
      } else {
        const targetPosition = currentScroll + scrollAmount;
        const maxScroll = container.scrollWidth - containerWidth;
        targetScroll = Math.min(maxScroll, targetPosition);
      }
      
      const cardIndex = Math.round(targetScroll / scrollAmount);
      const centeredScroll = cardIndex * scrollAmount - (containerWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, Math.min(centeredScroll, container.scrollWidth - containerWidth)),
        behavior: 'smooth',
      });
    }
  };

  const scrollTeachers = (direction: 'left' | 'right') => {
    if (teachersScrollRef) {
      const container = teachersScrollRef;
      const cardWidth = 280; // Largura do card
      const gap = 16; // Gap entre cards
      const scrollAmount = cardWidth + gap;
      const currentScroll = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      let targetScroll: number;
      if (direction === 'left') {
        const targetPosition = currentScroll - scrollAmount;
        targetScroll = Math.max(0, targetPosition);
      } else {
        const targetPosition = currentScroll + scrollAmount;
        const maxScroll = container.scrollWidth - containerWidth;
        targetScroll = Math.min(maxScroll, targetPosition);
      }
      
      const cardIndex = Math.round(targetScroll / scrollAmount);
      const centeredScroll = cardIndex * scrollAmount - (containerWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, Math.min(centeredScroll, container.scrollWidth - containerWidth)),
        behavior: 'smooth',
      });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!initialized || loadingUser) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          background: 'linear-gradient(135deg, #fff9f0 0%, #ffe8d6 50%, #fff5eb 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#ff9800' }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Verificando autenticação...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // O useEffect já redirecionou
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #fff9f0 0%, #ffe8d6 50%, #fff5eb 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#ff9800' }} />
        </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 3, fontSize: '1rem' }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!shelter) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 3, fontSize: '1rem' }}>
          Abrigo não encontrado.
        </Alert>
      </Container>
    );
  }

  const address = shelter.address;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff9f0 0%, #ffe8d6 50%, #fff5eb 100%)',
        pb: 6,
      }}
      >
      {shelter.mediaItem?.url && (
        <Box
          sx={{
            position: 'relative',
            height: { xs: '40vh', sm: '50vh', md: '60vh' },
            minHeight: { xs: 250, sm: 300, md: 500 },
            overflow: 'hidden',
            mb: { xs: 2, sm: 3, md: 5 },
          }}
        >
          <Box 
            component="img"
            src={shelter.mediaItem.url}
            alt={shelter.name}
            sx={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.7)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
            }}
          />
          <Container
            maxWidth="lg"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              pb: { xs: 2, sm: 3, md: 5 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
          >
            <IconButton 
              onClick={handleBack} 
              sx={{ 
                  mb: { xs: 2, md: 3 },
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: '#ff9800',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  width: { xs: 40, md: 48 },
                  height: { xs: 40, md: 48 },
                '&:hover': {
                    bgcolor: '#ff9800',
                  color: 'white',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
                <ArrowBackIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </IconButton>
              <Typography
                variant="h2"
              sx={{
                color: 'white',
                  fontWeight: 900,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem', lg: '3.5rem' },
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  mb: { xs: 1.5, md: 2 },
                  lineHeight: 1.2,
                  px: { xs: 0.5, md: 0 },
              }}
            >
                {shelter.name}
              </Typography>
              {shelter.description && (
            <Typography 
                  variant="h6"
              sx={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    maxWidth: { xs: '100%', md: '80%' },
                    lineHeight: { xs: 1.5, md: 1.6 },
              }}
            >
                  {shelter.description}
            </Typography>
              )}
        </motion.div>
          </Container>
        </Box>
      )}

      {!shelter.mediaItem?.url && (
        <Container maxWidth="lg" sx={{ pt: { xs: 2, sm: 3, md: 5 }, pb: { xs: 2, md: 3 }, px: { xs: 2, sm: 3 } }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, md: 2 },
                mb: { xs: 2, md: 3 },
                flexWrap: 'wrap',
              }}
            >
              <IconButton
                onClick={handleBack}
                sx={{
                  bgcolor: 'white',
                  color: '#ff9800',
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)',
                  width: { xs: 40, md: 48 },
                  height: { xs: 40, md: 48 },
                  '&:hover': {
                    bgcolor: '#ff9800',
                    color: 'white',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
        >
                <ArrowBackIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
              </IconButton>
              <Box
            sx={{ 
                  p: { xs: 1, md: 1.5 },
                  borderRadius: 2,
                  bgcolor: '#ff9800',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                }}
              >
                <HomeOutlined sx={{ fontSize: { xs: 24, md: 28 } }} />
              </Box>
            <Typography 
              variant="h3" 
              sx={{ 
                  fontWeight: 900,
                  fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.5rem' },
                  background: 'linear-gradient(45deg, #ff9800 30%, #ff5722 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                  flex: 1,
                  minWidth: { xs: '100%', sm: 'auto' },
              }}
            >
              {shelter.name}
            </Typography>
            </Box>
          {shelter.description && (
              <Typography 
                variant="h6"
                sx={{ 
                  color: '#5a6c7d',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  lineHeight: { xs: 1.6, md: 1.8 },
                  mb: { xs: 2, md: 3 },
                  pl: { xs: 0, sm: 7 },
                }}
              >
                {shelter.description}
              </Typography>
            )}
          </motion.div>
        </Container>
          )}

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={8}>
          {address && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Card
                  elevation={4}
                sx={{ 
                  mb: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff9f0 100%)',
                  border: '2px solid',
                    borderColor: '#ff9800',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #ff9800 0%, #ff5722 50%, #ff9800 100%)',
                  },
                }}
              >
                  <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                        gap: { xs: 1.5, md: 2 },
                        mb: { xs: 2, md: 3 },
                        pb: { xs: 1.5, md: 2 },
                    borderBottom: '2px solid',
                        borderColor: 'rgba(255, 152, 0, 0.2)',
                  }}
                >
                  <Box
                    sx={{
                          p: { xs: 1, md: 1.5 },
                      borderRadius: 2,
                          bgcolor: '#ff9800',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                          flexShrink: 0,
                    }}
                  >
                        <PlaceOutlined sx={{ fontSize: { xs: 24, md: 28 } }} />
                  </Box>
                  <Typography 
                        variant="h5"
                    sx={{ 
                          fontWeight: 800,
                          color: '#ff9800',
                          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                    }}
                  >
                        Localização
                  </Typography>
                </Box>
                    <Grid container spacing={{ xs: 2, md: 2.5 }}>
                <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 }, mb: { xs: 1.5, md: 2 } }}>
                          <MapOutlined sx={{ color: '#ff9800', mt: 0.5, fontSize: { xs: 20, md: 22 }, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                fontWeight: 600,
                                color: '#5a6c7d',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                              }}
                            >
                        Rua
                      </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: { xs: '0.9rem', md: '1rem' }, wordBreak: 'break-word' }}>
                        {address.street}
                        {address.number && `, ${address.number}`}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 }, mb: { xs: 1.5, md: 2 } }}>
                          <LocationCityOutlined sx={{ color: '#ff9800', mt: 0.5, fontSize: { xs: 20, md: 22 }, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                fontWeight: 600,
                                color: '#5a6c7d',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                              }}
                            >
                        Bairro
                      </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: { xs: '0.9rem', md: '1rem' }, wordBreak: 'break-word' }}>
                        {address.district}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 }, mb: { xs: 1.5, md: 2 } }}>
                          <LocationCityOutlined sx={{ color: '#ff9800', mt: 0.5, fontSize: { xs: 20, md: 22 }, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                fontWeight: 600,
                                color: '#5a6c7d',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                              }}
                            >
                              Cidade / Estado
                      </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: { xs: '0.9rem', md: '1rem' }, wordBreak: 'break-word' }}>
                        {address.city} - {address.state}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 } }}>
                          <LocalPostOfficeOutlined sx={{ color: '#ff9800', mt: 0.5, fontSize: { xs: 20, md: 22 }, flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                fontWeight: 600,
                                color: '#5a6c7d',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                              }}
                            >
                        CEP
                      </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                        {address.postalCode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                {address.complement && (
                  <Grid item xs={12}>
                          <Box sx={{ mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'rgba(255, 152, 0, 0.2)' }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 0.5,
                                fontWeight: 600,
                                color: '#5a6c7d',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                      Complemento
                    </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      {address.complement}
                    </Typography>
                          </Box>
                  </Grid>
                )}
              </Grid>
                  </CardContent>
                </Card>
            </motion.div>
          )}

          {shelter.teamsQuantity && shelter.teamsQuantity > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <Card
                  elevation={4}
                sx={{ 
                  mb: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)',
                  border: '2px solid',
                    borderColor: '#ff9800',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                      boxShadow: '0 8px 32px rgba(255, 152, 0, 0.25)',
                      transform: 'translateY(-4px)',
                  },
                }}
              >
                  <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                        gap: { xs: 1.5, md: 2 },
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  }}
                >
                  <Box
                    sx={{
                          p: { xs: 1, md: 1.5 },
                      borderRadius: 2,
                          bgcolor: '#ff9800',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                          flexShrink: 0,
                    }}
                  >
                        <GroupOutlined sx={{ fontSize: { xs: 24, md: 28 } }} />
                  </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography 
                          variant="h5"
                    sx={{ 
                            fontWeight: 800,
                            color: '#ff9800',
                            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                            mb: 0.5,
                    }}
                  >
                          Equipes de Trabalho
                  </Typography>
                        <Typography variant="body1" sx={{ color: '#5a6c7d', fontWeight: 500, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          Este abrigo possui {shelter.teamsQuantity} equipe{shelter.teamsQuantity > 1 ? 's' : ''} ativa{shelter.teamsQuantity > 1 ? 's' : ''}
                </Typography>
              </Box>
                    </Box>
                  </CardContent>
                </Card>
            </motion.div>
          )}
          </Grid>

          <Grid item xs={12} md={4}>
          {uniqueLeaders.length > 0 && (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                <Card
                  elevation={4}
                sx={{ 
                  mb: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)',
                    border: '2px solid',
                    borderColor: '#2196f3',
                }}
              >
                  <CardContent sx={{ p: { xs: 2, sm: 3, md: 3.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                        gap: { xs: 1, md: 1.5 },
                        mb: { xs: 2, md: 3 },
                        pb: { xs: 1.5, md: 2 },
                        borderBottom: '2px solid',
                        borderColor: 'rgba(33, 150, 243, 0.2)',
                  }}
                >
                  <Box
                    sx={{
                          p: { xs: 0.75, md: 1 },
                      borderRadius: 2,
                          bgcolor: '#2196f3',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                          flexShrink: 0,
                    }}
                  >
                        <PersonOutline sx={{ fontSize: { xs: 20, md: 24 } }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                          fontWeight: 800,
                          color: '#2196f3',
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                    }}
                  >
                    Líderes ({uniqueLeaders.length})
                  </Typography>
                </Box>
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        ref={setLeadersScrollRef}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          scrollBehavior: 'smooth',
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(33, 150, 243, 0.3) transparent',
                          pb: 2,
                          px: { xs: 5, sm: 6, md: 7 },
                          scrollSnapType: 'x mandatory',
                          '&::-webkit-scrollbar': {
                            height: 8,
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(33, 150, 243, 0.1)',
                            borderRadius: 4,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(33, 150, 243, 0.3)',
                            borderRadius: 4,
                            '&:hover': {
                              background: 'rgba(33, 150, 243, 0.5)',
                            },
                          },
                        }}
                      >
                  {uniqueLeaders.map((leader, index) => (
                          <Card
                      key={leader.id}
                            elevation={2}
                            sx={{
                              minWidth: { xs: 240, sm: 260 },
                              maxWidth: { xs: 240, sm: 260 },
                              borderRadius: 3,
                              bgcolor: 'white',
                              border: '1px solid',
                              borderColor: 'rgba(33, 150, 243, 0.15)',
                              transition: 'all 0.3s ease',
                              flexShrink: 0,
                              scrollSnapAlign: 'center',
                              scrollSnapStop: 'always',
                              overflow: 'hidden',
                              position: 'relative',
                              '&:hover': {
                                transform: 'translateY(-6px)',
                                boxShadow: '0 12px 24px rgba(33, 150, 243, 0.2)',
                                borderColor: '#2196f3',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                          <Avatar 
                            src={leader.user?.mediaItem?.url ?? undefined}
                            alt={leader.user?.name || 'Foto do líder'}
                            sx={{ 
                                  bgcolor: 'white',
                                  color: '#2196f3',
                                  width: { xs: 64, md: 72 },
                                  height: { xs: 64, md: 72 },
                                  fontWeight: 800,
                                  fontSize: { xs: '1.8rem', md: '2rem' },
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                  border: '3px solid white',
                            }}
                          >
                            {leader.user?.name?.charAt(0)?.toUpperCase() || 'L'}
                          </Avatar>
                            </Box>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography
                                variant="body1"
                        sx={{
                                  fontWeight: 700,
                                  color: '#2c3e50',
                                  mb: 1.5,
                                  fontSize: { xs: '0.95rem', md: '1rem' },
                                  wordBreak: 'break-word',
                                  lineHeight: 1.4,
                                }}
                              >
                                {leader.user?.name || 'Sem nome'}
                              </Typography>
                              {(() => {
                                const teams = getLeaderTeams(leader.id);
                                if (teams.length > 0) {
                                  return (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        mt: 1,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          p: 1,
                                          borderRadius: 1.5,
                                          bgcolor: 'rgba(33, 150, 243, 0.08)',
                                          width: '100%',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <GroupsIcon sx={{ fontSize: 16, color: '#2196f3', flexShrink: 0 }} />
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: '#2196f3',
                                            fontSize: { xs: '0.75rem', md: '0.8rem' },
                            fontWeight: 600,
                                          }}
                                        >
                                          {teams.length === 1
                                            ? `Equipe ${teams[0]}`
                                            : `Equipes: ${teams.join(', ')}`}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  );
                                }
                                return null;
                              })()}
                            </Box>
                          </Card>
                        ))}
                      </Box>
                      {uniqueLeaders.length > 1 && (
                        <>
                          <IconButton
                            onClick={() => scrollLeaders('left')}
                            sx={{
                              position: 'absolute',
                              left: { xs: 4, sm: 8 },
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'white',
                              color: '#2196f3',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              zIndex: 3,
                              width: { xs: 40, md: 44 },
                              height: { xs: 40, md: 44 },
                              '&:hover': {
                                bgcolor: '#2196f3',
                                color: 'white',
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                          },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <ChevronLeftIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                          </IconButton>
                          <IconButton
                            onClick={() => scrollLeaders('right')}
                            sx={{
                              position: 'absolute',
                              right: { xs: 4, sm: 8 },
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'white',
                              color: '#2196f3',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              zIndex: 3,
                              width: { xs: 40, md: 44 },
                              height: { xs: 40, md: 44 },
                          '&:hover': {
                                bgcolor: '#2196f3',
                            color: 'white',
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                          >
                            <ChevronRightIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                          </IconButton>
                        </>
                      )}
              </Box>
                  </CardContent>
                </Card>
            </motion.div>
          )}

          {uniqueTeachers.length > 0 && (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
            >
                <Card
                  elevation={4}
                sx={{ 
                  mb: 3,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f3e5f5 100%)',
                    border: '2px solid',
                    borderColor: '#9c27b0',
                }}
              >
                  <CardContent sx={{ p: { xs: 2, sm: 3, md: 3.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                        gap: { xs: 1, md: 1.5 },
                        mb: { xs: 2, md: 3 },
                        pb: { xs: 1.5, md: 2 },
                        borderBottom: '2px solid',
                        borderColor: 'rgba(156, 39, 176, 0.2)',
                  }}
                >
                  <Box
                    sx={{
                          p: { xs: 0.75, md: 1 },
                      borderRadius: 2,
                          bgcolor: '#9c27b0',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                          flexShrink: 0,
                    }}
                  >
                        <SchoolOutlined sx={{ fontSize: { xs: 20, md: 24 } }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                          fontWeight: 800,
                          color: '#9c27b0',
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                    }}
                  >
                    Professores ({uniqueTeachers.length})
                  </Typography>
                </Box>
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        ref={setTeachersScrollRef}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          scrollBehavior: 'smooth',
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(156, 39, 176, 0.3) transparent',
                          pb: 2,
                          px: { xs: 5, sm: 6, md: 7 },
                          scrollSnapType: 'x mandatory',
                          '&::-webkit-scrollbar': {
                            height: 8,
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(156, 39, 176, 0.1)',
                            borderRadius: 4,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(156, 39, 176, 0.3)',
                            borderRadius: 4,
                            '&:hover': {
                              background: 'rgba(156, 39, 176, 0.5)',
                            },
                          },
                        }}
                      >
                  {uniqueTeachers.map((teacher, index) => (
                          <Card
                      key={teacher.id}
                            elevation={2}
                            sx={{
                              minWidth: { xs: 240, sm: 260 },
                              maxWidth: { xs: 240, sm: 260 },
                              borderRadius: 3,
                              bgcolor: 'white',
                              border: '1px solid',
                              borderColor: 'rgba(156, 39, 176, 0.15)',
                              transition: 'all 0.3s ease',
                              flexShrink: 0,
                              scrollSnapAlign: 'center',
                              scrollSnapStop: 'always',
                              overflow: 'hidden',
                              position: 'relative',
                              '&:hover': {
                                transform: 'translateY(-6px)',
                                boxShadow: '0 12px 24px rgba(156, 39, 176, 0.2)',
                                borderColor: '#9c27b0',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                          <Avatar 
                            src={teacher.user?.mediaItem?.url ?? undefined}
                            alt={teacher.user?.name || 'Foto do professor'}
                            sx={{ 
                                  bgcolor: 'white',
                                  color: '#9c27b0',
                                  width: { xs: 64, md: 72 },
                                  height: { xs: 64, md: 72 },
                                  fontWeight: 800,
                                  fontSize: { xs: '1.8rem', md: '2rem' },
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                  border: '3px solid white',
                            }}
                          >
                            {teacher.user?.name?.charAt(0)?.toUpperCase() || 'P'}
                          </Avatar>
                            </Box>
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography
                                variant="body1"
                        sx={{
                                  fontWeight: 700,
                                  color: '#2c3e50',
                                  mb: 1.5,
                                  fontSize: { xs: '0.95rem', md: '1rem' },
                                  wordBreak: 'break-word',
                                  lineHeight: 1.4,
                                }}
                              >
                                {teacher.user?.name || 'Sem nome'}
                              </Typography>
                              {(() => {
                                const teams = getTeacherTeams(teacher.id);
                                if (teams.length > 0) {
                                  return (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        mt: 1,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          p: 1,
                                          borderRadius: 1.5,
                                          bgcolor: 'rgba(156, 39, 176, 0.08)',
                                          width: '100%',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <GroupsIcon sx={{ fontSize: 16, color: '#9c27b0', flexShrink: 0 }} />
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: '#9c27b0',
                                            fontSize: { xs: '0.75rem', md: '0.8rem' },
                            fontWeight: 600,
                                          }}
                                        >
                                          {teams.length === 1
                                            ? `Equipe ${teams[0]}`
                                            : `Equipes: ${teams.join(', ')}`}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  );
                                }
                                return null;
                              })()}
                            </Box>
                          </Card>
                        ))}
                      </Box>
                      {uniqueTeachers.length > 1 && (
                        <>
                          <IconButton
                            onClick={() => scrollTeachers('left')}
                            sx={{
                              position: 'absolute',
                              left: { xs: 4, sm: 8 },
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'white',
                              color: '#9c27b0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              zIndex: 3,
                              width: { xs: 40, md: 44 },
                              height: { xs: 40, md: 44 },
                              '&:hover': {
                                bgcolor: '#9c27b0',
                                color: 'white',
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)',
                          },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <ChevronLeftIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                          </IconButton>
                          <IconButton
                            onClick={() => scrollTeachers('right')}
                            sx={{
                              position: 'absolute',
                              right: { xs: 4, sm: 8 },
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'white',
                              color: '#9c27b0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              zIndex: 3,
                              width: { xs: 40, md: 44 },
                              height: { xs: 40, md: 44 },
                          '&:hover': {
                                bgcolor: '#9c27b0',
                            color: 'white',
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                          >
                            <ChevronRightIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                          </IconButton>
                        </>
                      )}
              </Box>
                  </CardContent>
                </Card>
            </motion.div>
          )}

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
          >
              <Card
                elevation={2}
              sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.1)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: '#5a6c7d',
                      mb: { xs: 1.5, md: 2 },
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                    }}
                  >
                    Informações
                  </Typography>
                  <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
                  <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 0.5,
                        fontWeight: 600,
                        color: '#5a6c7d',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontSize: { xs: '0.65rem', md: '0.75rem' },
                      }}
                    >
                  Criado em
                </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50', fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                  {fmtDate(shelter.createdAt)}
                </Typography>
              </Box>
              <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 0.5,
                        fontWeight: 600,
                        color: '#5a6c7d',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontSize: { xs: '0.65rem', md: '0.75rem' },
                      }}
                    >
                  Atualizado em
                </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50', fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                  {fmtDate(shelter.updatedAt)}
                </Typography>
              </Box>
                </CardContent>
              </Card>
          </motion.div>
          </Grid>
        </Grid>
    </Container>
    </Box>
  );
}
