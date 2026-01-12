import React from 'react';
import { Grid } from '@mui/material';
import { BannerSectionProps } from '../../types';
import { MemberWeekBanner, MemberMeditationBanner, IdeasSharingBanner } from '../Banners';

const BannerSection: React.FC<BannerSectionProps> = ({ showMeditationBanner }) => {
  return (
    <Grid
      container
      spacing={3}
      sx={{ mb: { xs: 4, md: 6 }, mt: 0, pt: 0, justifyContent: 'space-between' }}
    >
      {showMeditationBanner ? (
        <>
          <Grid item xs={12} md={6}>
            <IdeasSharingBanner variant="compact" />
          </Grid>

          <Grid item xs={12} md={6}>
            <MemberMeditationBanner />
          </Grid>
        </>
      ) : (
        <>
          <Grid item xs={12}>
            <IdeasSharingBanner variant="compact" />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default BannerSection;
