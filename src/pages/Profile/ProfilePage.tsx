import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoCameraIcon,
  HomeOutlined as HomeOutlinedIcon,
  GroupsOutlined as GroupsOutlinedIcon,
  PlaceOutlined as PlaceOutlinedIcon,
  Badge as BadgeIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '@/store/slices';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '@/store/slices/auth/authSlice';
import ProfileEditForm from '@/features/profile/components/ProfileEditForm';
import PasswordChangeForm from '@/features/profile/components/PasswordChangeForm';
import ProfileImageUpload from '@/features/profile/components/ProfileImageUpload';
import PersonalDataForm from '@/features/profile/components/PersonalDataForm';
import PreferencesForm from '@/features/profile/components/PreferencesForm';
import { PROFILE_ERROR_MESSAGES } from '@/constants/errors';

const menuItems = [
  { icon: <PersonIcon />, label: 'Informações da Conta', shortLabel: 'Conta' },
  { icon: <BadgeIcon />, label: 'Dados Pessoais', shortLabel: 'Pessoais' },
  { icon: <FavoriteIcon />, label: 'Minhas Preferências', shortLabel: 'Preferências' },
  { icon: <LockIcon />, label: 'Alterar Senha', shortLabel: 'Senha' },
  { icon: <PhotoCameraIcon />, label: 'Foto de Perfil', shortLabel: 'Foto' },
];

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, initialized, user, loadingUser } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialTab = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#foto') return 4;
      if (window.location.hash === '#pessoais') return 1;
      if (window.location.hash === '#preferencias') return 2;
    }
    return 0;
  }, []);
  const [selectedMenu, setSelectedMenu] = useState(initialTab);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#foto') setSelectedMenu(4);
      else if (window.location.hash === '#pessoais') setSelectedMenu(1);
      else if (window.location.hash === '#preferencias') setSelectedMenu(2);
      else setSelectedMenu(0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedMenu]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, initialized, navigate]);

  useEffect(() => {
    if (isAuthenticated && !user) {

      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  const profile = user ? {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone || '',
    role: user.role,
    active: user.active ?? false,
    completed: user.completed ?? false,
    commonUser: user.commonUser ?? false,
    createdAt: user.createdAt || '',
    updatedAt: user.updatedAt || '',
    image: user.image ? {
      id: user.image.id ?? '',
      url: user.image.url,
      title: user.image.title ?? '',
      description: user.image.description ?? '',
      mediaType: user.image.mediaType as string,
      uploadType: user.image.uploadType as string,
      isLocalFile: user.image.isLocalFile ?? false,
      platformType: user.image.platformType ?? null,
      originalName: user.image.originalName ?? '',
      size: user.image.size ?? 0,
      createdAt: user.image.createdAt ?? '',
      updatedAt: user.image.updatedAt ?? '',
    } : null,
  } : null;

  const completeProfile = user ? {
    personalData: user.personalData ? {
      birthDate: user.personalData.birthDate ?? undefined,
      gender: user.personalData.gender ?? undefined,
      gaLeaderName: user.personalData.gaLeaderName ?? undefined,
      gaLeaderContact: user.personalData.gaLeaderContact ?? undefined,
    } : undefined,
    preferences: user.preferences ? {
      loveLanguages: user.preferences.loveLanguages ?? undefined,
      temperaments: user.preferences.temperaments ?? undefined,
      favoriteColor: user.preferences.favoriteColor ?? undefined,
      favoriteFood: user.preferences.favoriteFood ?? undefined,
      favoriteMusic: user.preferences.favoriteMusic ?? undefined,
      whatMakesYouSmile: user.preferences.whatMakesYouSmile ?? undefined,
      skillsAndTalents: user.preferences.skillsAndTalents ?? undefined,
    } : undefined,
  } : null;

  const handleProfileUpdate = async () => {
    try {
      setError(null);
      await dispatch(fetchCurrentUser());
    } catch (err: any) {
      setError(err?.response?.data?.message || PROFILE_ERROR_MESSAGES.UPDATE_GENERIC);
    }
  };

  const handleMenuClick = (index: number) => {
    setSelectedMenu(index);
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 0:
        return (
          <ProfileEditForm
            profile={profile}
            onUpdate={handleProfileUpdate}
            onError={setError}
          />
        );
      case 1:
        return (
          <PersonalDataForm
            personalData={completeProfile?.personalData}
            onUpdate={handleProfileUpdate}
            onError={setError}
          />
        );
      case 2:
        return (
          <PreferencesForm
            preferences={completeProfile?.preferences}
            onUpdate={handleProfileUpdate}
            onError={setError}
          />
        );
      case 3:
        return (
          <PasswordChangeForm onError={setError} isCommonUser={profile?.commonUser ?? true} />
        );
      case 4:
        return (
          <ProfileImageUpload
            currentImageUrl={profile?.image?.url}
            onUpdate={handleProfileUpdate}
            onError={setError}
          />
        );
      default:
        return null;
    }
  };

  const isLoading = loadingUser || loading;

  if (!initialized || isLoading) {
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 1.5, md: 2 },
          p: { xs: 1.5, sm: 2, md: 3 },
          maxWidth: 1400,
          mx: 'auto',
          width: '100%',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <Paper
            elevation={3}
            sx={{
              width: { xs: '100%', md: 240, lg: 260 },
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 255, 0.98) 100%)',
              border: '1px solid rgba(25, 118, 210, 0.1)',
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                p: { xs: 1.5, sm: 2 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Avatar
                src={profile?.image?.url}
                sx={{
                  width: { xs: 60, sm: 70, md: 80 },
                  height: { xs: 60, sm: 70, md: 80 },
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '3px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
              >
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{
                    color: 'white',
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    lineHeight: 1.3,
                  }}
                >
                  {profile?.name || 'Carregando...'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.7rem',
                    display: 'block',
                    wordBreak: 'break-all',
                  }}
                >
                  {profile?.email}
                </Typography>
              </Box>
            </Box>

            {profile?.role === 'member' && user?.memberProfile?.team?.shelter && (
              <Tooltip
                title={
                  user.memberProfile.team.shelter.address ? (
                    <Box>
                      <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                        {user.memberProfile.team.shelter.name}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        {user.memberProfile.team.shelter.address.street}, {user.memberProfile.team.shelter.address.number}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {user.memberProfile.team.shelter.address.district} - {user.memberProfile.team.shelter.address.city}/{user.memberProfile.team.shelter.address.state}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        CEP: {user.memberProfile.team.shelter.address.postalCode}
                      </Typography>
                    </Box>
                  ) : user.memberProfile.team.shelter.name
                }
                arrow
                placement={isMobile ? 'bottom' : 'right'}
                enterTouchDelay={0}
                leaveTouchDelay={3000}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'white',
                      color: 'text.primary',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      border: '1px solid rgba(25, 118, 210, 0.2)',
                      p: 1.5,
                      maxWidth: { xs: 280, sm: 320 },
                      '& .MuiTooltip-arrow': {
                        color: 'white',
                        '&::before': {
                          border: '1px solid rgba(25, 118, 210, 0.2)',
                        },
                      },
                    },
                  },
                }}
              >
                <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'rgba(25, 118, 210, 0.05)', cursor: 'pointer' }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <HomeOutlinedIcon sx={{ fontSize: 16 }} color="primary" />
                      <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.3 }} noWrap>
                        {user.memberProfile.team.shelter.name}
                      </Typography>
                    </Stack>
                    <Chip
                      icon={<GroupsOutlinedIcon />}
                      label={`Equipe ${user.memberProfile.team.numberTeam}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, height: 24, '& .MuiChip-label': { px: 1 }, alignSelf: 'flex-start' }}
                    />
                  </Stack>
                </Box>
              </Tooltip>
            )}

            {profile?.role === 'leader' && user?.leaderProfile?.teams && user.leaderProfile.teams.length > 0 && (
              <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'rgba(25, 118, 210, 0.05)', maxHeight: { xs: 150, sm: 200 }, overflowY: 'auto' }}>
                <Typography variant="caption" fontWeight={700} color="primary" sx={{ display: 'block', mb: 1 }}>
                  Minhas Equipes ({user.leaderProfile.teams.length})
                </Typography>
                <Stack spacing={1}>
                  {user.leaderProfile.teams.map((team) => (
                    <Tooltip
                      key={team.id}
                      title={
                        team.shelter?.address ? (
                          <Box>
                            <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                              {team.shelter.name}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                              {team.shelter.address.street}, {team.shelter.address.number}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              {team.shelter.address.district} - {team.shelter.address.city}/{team.shelter.address.state}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              CEP: {team.shelter.address.postalCode}
                            </Typography>
                          </Box>
                        ) : team.shelter?.name || ''
                      }
                      arrow
                      placement={isMobile ? 'bottom' : 'right'}
                      enterTouchDelay={0}
                      leaveTouchDelay={3000}
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'white',
                            color: 'text.primary',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            border: '1px solid rgba(25, 118, 210, 0.2)',
                            p: 1.5,
                            maxWidth: { xs: 280, sm: 320 },
                            '& .MuiTooltip-arrow': {
                              color: 'white',
                              '&::before': {
                                border: '1px solid rgba(25, 118, 210, 0.2)',
                              },
                            },
                          },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: 'white',
                          border: '1px solid rgba(25, 118, 210, 0.15)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                          },
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <HomeOutlinedIcon sx={{ fontSize: 14 }} color="primary" />
                            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', lineHeight: 1.2 }} noWrap>
                              {team.shelter?.name}
                            </Typography>
                          </Stack>
                          <Chip
                            icon={<GroupsOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                            label={`Equipe ${team.numberTeam}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 }, alignSelf: 'flex-start' }}
                          />
                        </Stack>
                      </Box>
                    </Tooltip>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider />

            <List sx={{ p: 0.5 }} dense>
              {menuItems.map((item, index) => (
                <ListItemButton
                  key={index}
                  selected={selectedMenu === index}
                  onClick={() => handleMenuClick(index)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.25,
                    py: 0.75,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 32,
                      color: selectedMenu === index ? 'white' : 'primary.main',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={isSmall ? item.shortLabel : item.label}
                    primaryTypographyProps={{
                      fontWeight: selectedMenu === index ? 700 : 500,
                      fontSize: '0.8rem',
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              p: { xs: 2, sm: 2.5 },
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 255, 0.98) 100%)',
              border: '1px solid rgba(25, 118, 210, 0.1)',
            }}
          >
            <Box sx={{ mb: 2, pb: 1.5, borderBottom: '2px solid rgba(25, 118, 210, 0.1)' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {menuItems[selectedMenu].icon}
                </Box>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {menuItems[selectedMenu].label}
                </Typography>
              </Stack>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box>
              {renderContent()}
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default ProfilePage;
