import React from 'react';
import { Collapse, FormControl, Grid, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { FilterList as FilterIcon, Sort as SortIcon } from '@mui/icons-material';
import { ADVANCED_FILTER_FIELDS, MANAGER_PAPER_SX, MANAGER_TEXTS, PROFILE_SORT_OPTIONS } from './constants';
import type { ProfilesManagerState } from './useProfilesManager';
import { sortValueOf } from './utils';

const ProfilesAdvancedFilters: React.FC<{ state: ProfilesManagerState }> = ({ state }) => (
  <Collapse in={state.showFilters}>
    <Paper elevation={0} sx={{ p: 2, mb: 2, ...MANAGER_PAPER_SX, bgcolor: 'rgba(248,248,255,0.5)' }} data-testid="profiles-advanced-filters">
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary' }}>
        <FilterIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} /> Filtros Avançados
      </Typography>
      <Grid container spacing={2}>
        {ADVANCED_FILTER_FIELDS.map(({ field, label, placeholder }) => (
          <Grid item xs={12} sm={6} md={3} key={field}>
            <TextField
              label={label}
              placeholder={placeholder}
              value={state.filters[field] || ''}
              onChange={(e) => state.changeAdvanced(field, e.target.value)}
              size="small"
              fullWidth
              inputProps={{ 'data-testid': `profiles-filter-${field}` }}
            />
          </Grid>
        ))}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size="small" fullWidth>
            <InputLabel><SortIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} /> {MANAGER_TEXTS.sortBy}</InputLabel>
            <Select value={sortValueOf(state.filters)} onChange={state.changeSort} label={MANAGER_TEXTS.sortBy} data-testid="profiles-sort-select">
              {PROFILE_SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  </Collapse>
);

export default ProfilesAdvancedFilters;
