import React from 'react';
import { FormControl, MenuItem, Pagination, Paper, Select, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DEFAULT_PAGE_SIZE, MANAGER_PAPER_SX, MANAGER_TEXTS, PAGE_SIZE_OPTIONS } from './constants';
import type { ProfilesManagerState } from './useProfilesManager';

const ProfilesPagination: React.FC<{ state: ProfilesManagerState }> = ({ state }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { meta, filters, hasActiveFilters } = state;
  if (!meta) return null;

  return (
    <Paper elevation={0} sx={{ mt: 3, p: { xs: 1.5, sm: 2 }, ...MANAGER_PAPER_SX, bgcolor: 'rgba(255,255,255,0.8)' }} data-testid="profiles-pagination">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" alignItems="center" spacing={{ xs: 1.5, sm: 2 }} sx={{ position: 'relative' }}>
        {meta.totalPages > 1 && (
          <Pagination
            count={meta.totalPages}
            page={meta.currentPage}
            onChange={state.changePage}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            showFirstButton
            showLastButton
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={1}
          />
        )}

        <Stack direction="row" spacing={1} alignItems="center" sx={{ position: { xs: 'static', sm: 'absolute' }, right: { sm: 16 } }}>
          <FormControl size="small" sx={{ minWidth: { xs: 60, sm: 70 } }}>
            <Select
              value={filters.limit || DEFAULT_PAGE_SIZE}
              onChange={state.changeLimit}
              data-testid="profiles-page-size"
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }, bgcolor: 'white', borderRadius: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' }, '& .MuiSelect-select': { py: 0.75 } }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, whiteSpace: 'nowrap' }} data-testid="profiles-total">
            de <strong>{meta.totalItems}</strong>
            {hasActiveFilters && MANAGER_TEXTS.filtered}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ProfilesPagination;
