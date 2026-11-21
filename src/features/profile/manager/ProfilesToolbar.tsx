import React from 'react';
import { Chip, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip } from '@mui/material';
import { Clear as ClearIcon, FilterList as FilterIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import { roleConfig } from '../utils';
import { MANAGER_PAPER_SX, MANAGER_TEXTS, ROLE_FILTER_OPTIONS } from './constants';
import type { ProfilesManagerState } from './useProfilesManager';
import { isRoleSelected } from './utils';

interface Props {
  state: ProfilesManagerState;
  isLeader: boolean;
}

const ProfilesToolbar: React.FC<Props> = ({ state, isLeader }) => {
  const { searchInput, setSearchInput, filters, showFilters, loading, hasActiveFilters } = state;
  return (
    <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, ...MANAGER_PAPER_SX, bgcolor: 'rgba(255,255,255,0.8)' }} data-testid="profiles-toolbar">
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.5, sm: 2 }} alignItems={{ xs: 'stretch', md: 'center' }}>
        <TextField
          placeholder={MANAGER_TEXTS.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          inputProps={{ 'data-testid': 'profiles-search-input' }}
          sx={{ flex: 1, minWidth: { xs: '100%', md: 200 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment>,
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchInput('')} aria-label="Limpar busca" data-testid="profiles-search-clear" sx={{ minWidth: 44, minHeight: 44 }}>
                  <ClearIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}>
          {!isLeader && ROLE_FILTER_OPTIONS.map((role) => {
            const selected = isRoleSelected(filters, role);
            const config = role === 'all' ? null : roleConfig[role];
            return (
              <Chip
                key={role}
                label={role === 'all' ? MANAGER_TEXTS.all : config?.label}
                size="small"
                onClick={() => state.changeRole(role)}
                data-testid={`profiles-role-${role}`}
                sx={{
                  fontWeight: selected ? 700 : 500,
                  fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                  height: { xs: 32, sm: 32 },
                  bgcolor: selected ? (config?.color || '#667eea') : 'rgba(0,0,0,0.04)',
                  color: selected ? 'white' : 'text.secondary',
                  '&:hover': { bgcolor: selected ? (config?.color || '#667eea') : 'rgba(0,0,0,0.08)' },
                }}
              />
            );
          })}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}>
          <Tooltip title={MANAGER_TEXTS.advancedFilters}>
            <IconButton
              size="small"
              onClick={state.toggleFilters}
              aria-label={MANAGER_TEXTS.advancedFilters}
              data-testid="profiles-filters-toggle"
              sx={{ minWidth: 44, minHeight: 44, bgcolor: showFilters ? 'primary.main' : 'rgba(0,0,0,0.04)', color: showFilters ? 'white' : 'text.secondary', '&:hover': { bgcolor: showFilters ? 'primary.dark' : 'rgba(0,0,0,0.08)' } }}
            >
              <FilterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={MANAGER_TEXTS.refresh}>
            <span>
              <IconButton size="small" onClick={state.refresh} disabled={loading} aria-label={MANAGER_TEXTS.refresh} data-testid="profiles-refresh" sx={{ minWidth: 44, minHeight: 44, bgcolor: 'rgba(0,0,0,0.04)' }}>
                {loading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          {hasActiveFilters && (
            <Tooltip title={MANAGER_TEXTS.clearFilters}>
              <IconButton size="small" onClick={state.clearFilters} aria-label={MANAGER_TEXTS.clearFilters} data-testid="profiles-clear-filters" sx={{ minWidth: 44, minHeight: 44, bgcolor: 'rgba(244,67,54,0.1)', color: '#f44336' }}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ProfilesToolbar;
