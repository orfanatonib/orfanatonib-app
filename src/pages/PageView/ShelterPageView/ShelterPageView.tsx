import React, { useState } from 'react';
import { Alert, Box, CircularProgress, Container } from '@mui/material';
import './../styles/ShelterPageView.css';
import { useShelterPage } from './useShelterPage';
import ShelterHero from './ShelterHero';
import ShelterStatsStrip from './ShelterStatsStrip';
import ShelterAboutCard from './ShelterAboutCard';
import ShelterPeopleSection from './ShelterPeopleSection';
import ShelterTeamsSection from './ShelterTeamsSection';
import ShelterPhotoDialog, { type ShelterPhoto } from './ShelterPhotoDialog';
import { SHELTER_PAGE_WIDTH } from './constants';
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
    uniqueMembers,
    getLeaderTeams,
    getMemberTeams,
  } = useShelterPage(idToFetch);

  const [photo, setPhoto] = useState<ShelterPhoto | null>(null);
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
    <Box data-testid="shelter-page" className="shelterPage">
      <ShelterHero
        name={shelter.name}
        description={shelter.description}
        heroImageSrc={heroImageSrc}
        onBack={handleBack}
      />

      <Container
        data-testid="shelter-page-body"
        maxWidth={false}
        disableGutters
        sx={{ width: SHELTER_PAGE_WIDTH, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2.5 }, pb: 2 }}
      >
        <ShelterStatsStrip
          teams={shelter.teams?.length || shelter.teamsQuantity || 0}
          leaders={uniqueLeaders.length}
          members={uniqueMembers.length}
        />

        {isAddressEnabled && address && (
          <ShelterAboutCard address={address} updatedAt={shelter.updatedAt} />
        )}

        <ShelterTeamsSection teams={shelter.teams ?? []} onOpenPhoto={setPhoto} />

        <ShelterPeopleSection
          leaders={uniqueLeaders}
          members={uniqueMembers}
          getLeaderTeams={getLeaderTeams}
          getMemberTeams={getMemberTeams}
          onOpenPhoto={setPhoto}
        />
      </Container>

      <ShelterPhotoDialog photo={photo} onClose={() => setPhoto(null)} />
    </Box>
  );
}
