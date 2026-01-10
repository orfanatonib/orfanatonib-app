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

interface ShelterPageViewProps {
  idToFetch: string;
}

const FALLBACK_SHELTER_IMAGE =
  (import.meta as any).env?.VITE_SHELTER_FALLBACK_IMAGE_URL ||
  'https://orfanatos-nib-storage.s3.us-east-1.amazonaws.com/aux/banner-orfanatos.png';

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
          <Grid item xs={12} md={8}>
            {address ? <ShelterLocationCard address={address} /> : null}
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
        </Grid>
      </Container>
    </Box>
  );
}
