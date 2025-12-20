import React from 'react';
import { Box } from '@mui/material';
import { gradients } from '@/theme';
import { HeroSection, FeaturesSection, TestimonialsSection, CTASection } from './components';
import VisitMaterialsBanner from './VisitMaterialsBanner';
import CardsSection from './CardsSection';
import SheltersSection from './SheltersSection';
import { FEATURES } from './constants';
import { useComments, useAuth } from './hooks';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const comments = useComments();

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
      {isAuthenticated && <VisitMaterialsBanner />}
      <SheltersSection />
      <CardsSection />
      <FeaturesSection features={FEATURES} />
      {comments && comments.length > 0 && (
        <TestimonialsSection testimonials={comments.filter(comment => comment.id) as any} />
      )}
      <CTASection isAuthenticated={isAuthenticated} />
    </Box>
  );
};

export default Home;


;