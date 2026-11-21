import React from 'react';
import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Star as StarIcon,
  Restaurant as RestaurantIcon,
  Palette as PaletteIcon,
  MusicNote as MusicNoteIcon,
  EmojiEmotions as EmojiIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { PREFERENCE_GRID, PROFILE_DETAIL_TEXTS } from './constants';
import type { PreferenceGridKey, ProfileDetailPreferences } from './types';

const GRID_ICONS: Record<PreferenceGridKey, SvgIconComponent> = {
  loveLanguages: FavoriteIcon,
  temperaments: StarIcon,
  favoriteFood: RestaurantIcon,
  favoriteColor: PaletteIcon,
  favoriteMusic: MusicNoteIcon,
};

const ProfilePreferencesSection: React.FC<{ preferences: ProfileDetailPreferences }> = ({ preferences }) => (
  <Box data-testid="profile-detail-preferences">
    <Divider sx={{ mb: 1.5 }} />
    <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {PROFILE_DETAIL_TEXTS.getToKnow}
    </Typography>

    <Grid container spacing={1} sx={{ mt: 0.5 }}>
      {PREFERENCE_GRID.map(({ key, color, fullWidth }) => {
        const value = preferences[key];
        if (!value) return null;
        const Icon = GRID_ICONS[key];
        return (
          <Grid item xs={fullWidth ? 12 : 6} key={key}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Icon sx={{ fontSize: 14, color }} />
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                {value}
              </Typography>
            </Stack>
          </Grid>
        );
      })}
    </Grid>

    {(preferences.whatMakesYouSmile || preferences.skillsAndTalents) && (
      <Box sx={{ mt: 1.5 }}>
        {preferences.whatMakesYouSmile && (
          <Box sx={{ p: 1.5, bgcolor: 'rgba(76, 175, 80, 0.06)', borderRadius: 2, mb: 1 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
              <EmojiIcon sx={{ fontSize: 14, color: '#4caf50' }} />
              <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600, fontSize: '0.65rem' }}>
                {PROFILE_DETAIL_TEXTS.smile}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.75rem' }}>
              "{preferences.whatMakesYouSmile}"
            </Typography>
          </Box>
        )}
        {preferences.skillsAndTalents && (
          <Box sx={{ p: 1.5, bgcolor: 'rgba(33, 150, 243, 0.06)', borderRadius: 2 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
              <BuildIcon sx={{ fontSize: 14, color: '#2196f3' }} />
              <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600, fontSize: '0.65rem' }}>
                {PROFILE_DETAIL_TEXTS.talents}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {preferences.skillsAndTalents}
            </Typography>
          </Box>
        )}
      </Box>
    )}
  </Box>
);

export default ProfilePreferencesSection;
