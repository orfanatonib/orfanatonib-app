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
import { RootState } from '@/store/slices';
import { apiGetProfile, apiGetCompleteProfile } from '@/features/profile/api';
import { Profile, CompleteProfile } from '@/features/profile/types';
import ProfileEditForm from '@/features/profile/components/ProfileEditForm';
import PasswordChangeForm from '@/features/profile/components/PasswordChangeForm';
import ProfileImageUpload from '@/features/profile/components/ProfileImageUpload';
import PersonalDataForm from '@/features/profile/components/PersonalDataForm';
import PreferencesForm from '@/features/profile/components/PreferencesForm';

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
  const { isAuthenticated, initialized } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completeProfile, setCompleteProfile] = useState<CompleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Detect hash for direct tab selection
  const initialTab = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#foto') return 4;
      if (window.location.hash === '#pessoais') return 1;
      if (window.location.hash === '#preferencias') return 2;
    }
    return 0;
  }, []);
  const [selectedMenu, setSelectedMenu] = useState(initialTab);

  // If hash changes after mount, update tab
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#foto') setSelectedMenu(4);
      else if (window.location.hash === '#pessoais') setSelectedMenu(1);
      else if (window.location.hash === '#preferencias') setSelectedMenu(2);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
      const [profileData, completeProfileData] = await Promise.all([
        apiGetProfile(),
        apiGetCompleteProfile().catch(() => null), // Pode não existir ainda
      ]);
      setProfile(profileData);
      setCompleteProfile(completeProfileData);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err?.response?.data?.message || 'Erro ao carregar perfil. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
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
            onUpdate={loadProfile}
            onError={setError}
          />
        );
      case 1:
        return (
          <PersonalDataForm
            personalData={completeProfile?.personalData}
            onUpdate={loadProfile}
            onError={setError}
          />
        );
      case 2:
        return (
          <PreferencesForm
            preferences={completeProfile?.preferences}
            onUpdate={loadProfile}
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
            onUpdate={loadProfile}
            onError={setError}
          />
        );
      default:
        return null;
    }
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
        {/* Sidebar */}
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
            {/* User Header */}
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

            {/* Shelter Info */}
            {profile?.role === 'teacher' && profile?.teacherProfile?.team?.shelter && (
              <Box sx={{ px: 1.5, py: 1, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <HomeOutlinedIcon sx={{ fontSize: 16 }} color="primary" />
                    <Typography variant="caption" fontWeight={700} noWrap>
                      {profile.teacherProfile.team.shelter.name}
                    </Typography>
                  </Stack>
                  <Chip
                    icon={<GroupsOutlinedIcon />}
                    label={`Equipe ${profile.teacherProfile.team.numberTeam}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, height: 24, '& .MuiChip-label': { px: 1 } }}
                  />
                </Stack>
              </Box>
            )}

            <Divider />

            {/* Menu Items */}
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

        {/* Main Content */}
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
            {/* Content Header */}
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

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Content Area */}
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

