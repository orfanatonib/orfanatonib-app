import React from 'react';
import { Alert, Box, Chip, CircularProgress, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/slices';
import BackHeader from '@/components/common/header/BackHeader';
import NoTeamLinked from '@/components/common/NoTeamLinked';
import { useAuthRole } from '../../utils/useAuthRole';
import BirthdaySection from './components/BirthdaySection';
import { ProfileCard, ProfileCardSkeleton } from './components/ProfileCard';
import ProfileDetailModal from './components/ProfileDetailModal';
import { MANAGER_PAPER_SX, MANAGER_TEXTS } from './manager/constants';
import ProfilesAdvancedFilters from './manager/ProfilesAdvancedFilters';
import ProfilesPagination from './manager/ProfilesPagination';
import ProfilesToolbar from './manager/ProfilesToolbar';
import { useProfilesManager } from './manager/useProfilesManager';
import { hasBirthdays } from './manager/utils';

const SKELETON_COUNT = 8;
const SKELETON_KEYS = Array.from({ length: SKELETON_COUNT }, (_, i) => `profile-skeleton-${i + 1}`);

const ProfilesManager: React.FC = () => {
  const { isLeader } = useAuthRole();
  const user = useSelector((state: RootState) => state.auth.user);
  const state = useProfilesManager();
  const { profiles, loading, birthdays, selectedProfile, setSelectedProfile } = state;

  if (loading && profiles.length === 0) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minHeight: '100%' }} data-testid="profiles-loading">
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Skeleton variant="text" width={300} height={50} sx={{ mx: 'auto', maxWidth: '100%' }} />
          <Skeleton variant="text" width={400} height={24} sx={{ mx: 'auto', mt: 1, maxWidth: '100%' }} />
        </Box>
        <Grid container spacing={2}>
          {SKELETON_KEYS.map((key) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
              <ProfileCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Líder sem equipe vinculada: mostra o aviso em vez do conteúdo.
  if (isLeader && (!user?.leaderProfile?.teams || user.leaderProfile.teams.length === 0)) {
    return <NoTeamLinked showBackButton={false} />;
  }

  return (
    <Box data-testid="profiles-manager" sx={{ p: { xs: 2, sm: 3 }, width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <BackHeader title={MANAGER_TEXTS.title} />

      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={state.dismissError} data-testid="profiles-error">
          {state.error}
        </Alert>
      )}

      {!state.loadingBirthdays && hasBirthdays(birthdays) && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} data-testid="profiles-birthdays">
          <BirthdaySection title="Aniversário Hoje! 🎉" emoji="🎂" profiles={birthdays.today} variant="today" onProfileClick={setSelectedProfile} />
          <BirthdaySection title="Esta Semana" emoji="🎈" profiles={birthdays.week} variant="week" onProfileClick={setSelectedProfile} />
          <BirthdaySection title="Este Mês" emoji="🎁" profiles={birthdays.month} variant="month" onProfileClick={setSelectedProfile} />
        </Stack>
      )}

      <ProfilesToolbar state={state} isLeader={isLeader} />
      <ProfilesAdvancedFilters state={state} />

      {profiles.length === 0 && !loading ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', ...MANAGER_PAPER_SX, borderRadius: 4 }} data-testid="profiles-empty">
          <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>{MANAGER_TEXTS.empty}</Typography>
          <Typography variant="body2" color="text.disabled">{MANAGER_TEXTS.emptyHint}</Typography>
          {state.hasActiveFilters && <Chip label={MANAGER_TEXTS.clearFilters} onClick={state.clearFilters} sx={{ mt: 2 }} color="primary" variant="outlined" />}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2} data-testid="profiles-list">
            <AnimatePresence>
              {profiles.map((profile, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={profile.id}>
                  <ProfileCard profile={profile} index={index} onClick={() => setSelectedProfile(profile)} />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
          <ProfilesPagination state={state} />
        </>
      )}

      {loading && profiles.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }} data-testid="profiles-reloading">
          <Paper elevation={8} sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white' }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">{MANAGER_TEXTS.loading}</Typography>
          </Paper>
        </Box>
      )}

      <ProfileDetailModal profile={selectedProfile} open={!!selectedProfile} onClose={() => setSelectedProfile(null)} />
    </Box>
  );
};

export default ProfilesManager;
