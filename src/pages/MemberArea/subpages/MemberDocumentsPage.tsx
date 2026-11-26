import React from 'react';
import { Box } from '@mui/material';
import { DocumentsSection } from '../components/Sections';

const MemberDocumentsPage: React.FC = () => (
  <Box data-testid="member-documents-page">
    <DocumentsSection />
  </Box>
);

export default MemberDocumentsPage;
