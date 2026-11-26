import React from 'react';
import { Box } from '@mui/material';
import { IdeasGallerySection } from '../components/Sections';

const MemberIdeasPage: React.FC = () => (
  <Box data-testid="member-ideas-page">
    <IdeasGallerySection />
  </Box>
);

export default MemberIdeasPage;
