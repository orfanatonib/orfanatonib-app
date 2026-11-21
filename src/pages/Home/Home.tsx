import React from 'react';
import { Box } from '@mui/material';
import { gradients } from '@/theme';
import { HeroSection, FeaturesSection, TestimonialsSection, CTASection } from './components';
import VisitMaterialsBanner from './VisitMaterialsBanner';
import CardsSection from './CardsSection';
import SheltersSection from './components/SheltersSection';
import { FEATURES } from './constants';
import { useComments, useAuth } from './hooks';
import { FeatureGate } from '@/components/common/FeatureGate';
import { FeatureFlagKeys, useIsFeatureEnabled } from '@/features/feature-flags';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const homeCommentsEnabled = useIsFeatureEnabled(FeatureFlagKeys.HOME_COMMENTS);
  const comments = useComments(homeCommentsEnabled);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        background: gradients.subtle.greenWhite,
      }}
    >
      <HeroSection isAuthenticated={isAuthenticated} />
      {isAuthenticated && (
        <FeatureGate flag={FeatureFlagKeys.VISIT_MATERIALS}>
          <VisitMaterialsBanner />
        </FeatureGate>
      )}
      <SheltersSection />
      <CardsSection />
      <FeaturesSection features={FEATURES} />
      {homeCommentsEnabled && comments && comments.length > 0 && (
        <TestimonialsSection testimonials={comments.flatMap(({ id, comment, name, shelter, neighborhood }) =>
            id ? [{ id, comment, name, shelter, neighborhood }] : [],
          )} />
      )}
      <CTASection isAuthenticated={isAuthenticated} />
    </Box>
  );
};

export default Home;

;