import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoCameraIcon,
  HomeOutlined as HomeOutlinedIcon,
  GroupsOutlined as GroupsOutlinedIcon,
  PlaceOutlined as PlaceOutlinedIcon,
} from '@mui/icons-material';
import { RootState } from '@/store/slices';
import { apiGetProfile } from '@/features/profile/api';
import { Profile } from '@/features/profile/types';
import ProfileEditForm from '@/features/profile/components/ProfileEditForm';
import PasswordChangeForm from '@/features/profile/components/PasswordChangeForm';
import ProfileImageUpload from '@/features/profile/components/ProfileImageUpload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, initialized } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, initialized, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetProfile();
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err?.response?.data?.message || 'Erro ao carregar perfil. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!initialized || loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #ffffff 100%)',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #ffffff 100%)',
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={4}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 255, 0.95) 100%)',
              border: '1px solid rgba(25, 118, 210, 0.1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                gap: 3,
                mb: 4,
                pb: 3,
                borderBottom: '2px solid rgba(25, 118, 210, 0.1)',
              }}
            >
              <Avatar
                src={profile?.image?.url}
                sx={{
                  width: { xs: 100, sm: 120, md: 140 },
                  height: { xs: 100, sm: 120, md: 140 },
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  bgcolor: 'primary.main',
                  border: '4px solid white',
                  boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
                }}
              >
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  {profile?.name || 'Carregando...'}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.9rem', md: '1rem' }, 
                    mb: 0.5,
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                  title={profile?.email}
                >
                  {profile?.email}
                </Typography>
                {profile?.phone && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.85rem', md: '0.9rem' },
                      wordBreak: 'break-all',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {profile.phone}
                  </Typography>
                )}
              </Box>
            </Box>

            {profile?.role === 'teacher' && profile?.teacherProfile?.team?.shelter && (
              <Box sx={{ mb: 3 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 2,
                    bgcolor: 'rgba(25, 118, 210, 0.03)',
                    borderColor: 'rgba(25, 118, 210, 0.15)',
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={900} sx={{ letterSpacing: 0.2 }}>
                      Olá membro, você está participando do abrigo:
                    </Typography>

                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                          <HomeOutlinedIcon fontSize="small" color="primary" />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 800, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={profile.teacherProfile.team.shelter.name}
                          >
                            {profile.teacherProfile.team.shelter.name}
                          </Typography>
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                        >
                          {(() => {
                            const teamNumber = profile.teacherProfile.team.numberTeam;
                            const teamDesc = profile.teacherProfile.team.description?.trim() || '';
                            const defaultLabel = `Equipe ${teamNumber}`;
                            const showDesc =
                              !!teamDesc &&
                              teamDesc.toLowerCase() !== defaultLabel.toLowerCase();
                            return (
                              <>
                                <Chip
                                  icon={<GroupsOutlinedIcon />}
                                  label={defaultLabel}
                                  color="primary"
                                  variant="outlined"
                                  sx={{ fontWeight: 800 }}
                                />
                                {showDesc && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontWeight: 700 }}
                                  >
                                    {teamDesc}
                                  </Typography>
                                )}
                              </>
                            );
                          })()}
                        </Stack>
                      </Grid>

                      {!!profile.teacherProfile.team.shelter.address?.city && (
                        <Grid item xs={12}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PlaceOutlinedIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              {profile.teacherProfile.team.shelter.address?.district
                                ? `${profile.teacherProfile.team.shelter.address?.district} • `
                                : ""}
                              {profile.teacherProfile.team.shelter.address?.city}
                              {profile.teacherProfile.team.shelter.address?.state
                                ? `/${profile.teacherProfile.team.shelter.address?.state}`
                                : ''}
                            </Typography>
                          </Stack>
                        </Grid>
                      )}
                    </Grid>
                  </Stack>
                </Paper>
              </Box>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant={isMobile ? 'fullWidth' : 'standard'}
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-flexContainer': {
                    gap: { xs: 0.5, sm: 0 },
                  },
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.65rem', sm: '0.9rem', md: '1rem' },
                    minHeight: { xs: 40, sm: 48, md: 64 },
                    textTransform: 'none',
                    fontWeight: 600,
                    px: { xs: 0.5, sm: 2, md: 3 },
                    flex: { xs: 1, sm: 'none' },
                    maxWidth: { xs: 'none', sm: 'none' },
                    '& .MuiTab-iconWrapper': {
                      fontSize: { xs: '0.9rem', sm: '1.25rem', md: '1.5rem' },
                      mb: { xs: 0, sm: 0.5 },
                    },
                  },
                }}
              >
                <Tab
                  icon={<PersonIcon />}
                  iconPosition={isMobile ? 'top' : 'start'}
                  label={isMobile ? 'Informações' : 'Informações Pessoais'}
                  id="profile-tab-0"
                  aria-controls="profile-tabpanel-0"
                />
                <Tab
                  icon={<LockIcon />}
                  iconPosition={isMobile ? 'top' : 'start'}
                  label={isMobile ? 'Senha' : 'Alterar Senha'}
                  id="profile-tab-1"
                  aria-controls="profile-tabpanel-1"
                />
                <Tab
                  icon={<PhotoCameraIcon />}
                  iconPosition={isMobile ? 'top' : 'start'}
                  label={isMobile ? 'Foto' : 'Foto de Perfil'}
                  id="profile-tab-2"
                  aria-controls="profile-tabpanel-2"
                />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TabPanel value={tabValue} index={0}>
              <ProfileEditForm
                profile={profile}
                onUpdate={loadProfile}
                onError={setError}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <PasswordChangeForm onError={setError} isCommonUser={profile?.commonUser ?? true} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <ProfileImageUpload
                currentImageUrl={profile?.image?.url}
                onUpdate={loadProfile}
                onError={setError}
              />
            </TabPanel>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ProfilePage;

