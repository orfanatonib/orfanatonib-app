// src/pages/shelters/ShelterPageView.tsx
import React from 'react';
import { Alert, Box, CircularProgress, Container, Grid } from '@mui/material';
import { PersonOutline, SchoolOutlined } from '@mui/icons-material';
import './../styles/ShelterPageView.css';
import { useShelterPage } from './useShelterPage';
import ShelterHero from './ShelterHero';
import ShelterLocationCard from './ShelterLocationCard';
import ShelterTeamsSummaryCard from './ShelterTeamsSummaryCard';
import ShelterPeopleCarouselCard from './ShelterPeopleCarouselCard';
import ShelterInfoCard from './ShelterInfoCard';
import { useIsFeatureEnabled, FeatureFlagKeys } from '@/features/feature-flags';

interface ShelterPageViewProps {
  idToFetch: string;
}

const FALLBACK_SHELTER_IMAGE =
  (import.meta as any).env?.VITE_SHELTER_FALLBACK_IMAGE_URL;
export default function ShelterPageView({ idToFetch }: ShelterPageViewProps) {
  const {
    initialized,
    loadingUser,
    isAuthenticated,
    shelter,
    loading,
    error,
    uniqueLeaders,
    uniqueTeachers,
    getLeaderTeams,
    getTeacherTeams,
  } = useShelterPage(idToFetch);

  const isAddressEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_ADDRESS);



  const handleBack = () => window.history.back();

  if (!initialized || loadingUser) {
    return (
      <Box className="shelterPage__center">
        <CircularProgress size={56} className="shelterPage__spinner" />
      </Box>
    );
  }

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <Box className="shelterPage__loading">
        <CircularProgress size={56} className="shelterPage__spinner" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className="shelterPage__containerPad">
        <Alert severity="error" className="shelterPage__alert">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!shelter) {
    return (
      <Container maxWidth="lg" className="shelterPage__containerPad">
        <Alert severity="info" className="shelterPage__alert">
          Abrigo não encontrado.
        </Alert>
      </Container>
    );
  }

  const address = shelter.address;
  const heroImageSrc = shelter.mediaItem?.url?.trim() ? shelter.mediaItem!.url : FALLBACK_SHELTER_IMAGE;

  return (
    <Box className="shelterPage">
      <ShelterHero
        name={shelter.name}
        description={shelter.description}
        heroImageSrc={heroImageSrc}
        onBack={handleBack}
      />

      <Container maxWidth="lg" className="shelterPage__main">
        <Grid container spacing={2.5}>
          {isAddressEnabled && address ? (
            <>
              <Grid item xs={12} md={8}>
                <ShelterLocationCard address={address} />
                <ShelterTeamsSummaryCard teamsQuantity={shelter.teamsQuantity || 0} />
              </Grid>

              <Grid item xs={12} md={4}>
                <ShelterPeopleCarouselCard
                  title="Líderes"
                  count={uniqueLeaders.length}
                  theme="blue"
                  icon={<PersonOutline className="shelterPage__sectionIcon" />}
                  people={uniqueLeaders}
                  getTeams={getLeaderTeams}
                />

                <ShelterPeopleCarouselCard
                  title="Membros"
                  count={uniqueTeachers.length}
                  theme="purple"
                  icon={<SchoolOutlined className="shelterPage__sectionIcon" />}
                  people={uniqueTeachers}
                  getTeams={getTeacherTeams}
                />

                <ShelterInfoCard createdAt={shelter.createdAt} updatedAt={shelter.updatedAt} />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12}>
                <ShelterTeamsSummaryCard teamsQuantity={shelter.teamsQuantity || 0} />
              </Grid>

              <Grid item xs={12} md={6}>
                <ShelterPeopleCarouselCard
                  title="Líderes"
                  count={uniqueLeaders.length}
                  theme="blue"
                  icon={<PersonOutline className="shelterPage__sectionIcon" />}
                  people={uniqueLeaders}
                  getTeams={getLeaderTeams}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <ShelterPeopleCarouselCard
                  title="Membros"
                  count={uniqueTeachers.length}
                  theme="purple"
                  icon={<SchoolOutlined className="shelterPage__sectionIcon" />}
                  people={uniqueTeachers}
                  getTeams={getTeacherTeams}
                />
              </Grid>

              <Grid item xs={12}>
                <ShelterInfoCard createdAt={shelter.createdAt} updatedAt={shelter.updatedAt} />
              </Grid>
            </>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
