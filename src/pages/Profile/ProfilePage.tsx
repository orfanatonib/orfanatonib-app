import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Container,
} from '@mui/material';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '@/store/slices';
import { fetchCurrentUser } from '@/store/slices/auth/authSlice';
import ProfileEditForm from '@/features/profile/components/ProfileEditForm';
import PasswordChangeForm from '@/features/profile/components/PasswordChangeForm';
import ProfileImageUpload from '@/features/profile/components/ProfileImageUpload';
import PersonalDataForm from '@/features/profile/components/PersonalDataForm';
import PreferencesForm from '@/features/profile/components/PreferencesForm';
import { PROFILE_ERROR_MESSAGES } from '@/constants/errors';
import ProfileSidebar, { menuItems } from './components/ProfileSidebar';
import ImagePreviewDialog from '@/components/Common/ImagePreviewDialog';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        <ProfileSidebar
          profile={profile}
          user={user}
          selectedMenu={selectedMenu}
          onMenuClick={handleMenuClick}
          onImageClick={(url) => setPreviewImage(url)}
        />

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

      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
        alt="Foto de Perfil"
      />
    </Box>
  );
};

export default ProfilePage;
