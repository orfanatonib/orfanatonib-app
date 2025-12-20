import React from 'react';
import { Box, TextField, IconButton, Tooltip, CircularProgress, InputAdornment } from '@mui/material';
import { Refresh, Search, Clear } from '@mui/icons-material';

type Props = {
  search: string;
  onSearch: (v: string) => void;
  onRefresh: () => void;
  isFiltering?: boolean;
};

export default function IdeasToolbar({ search, onSearch, onRefresh, isFiltering }: Props) {
  const hasQuery = Boolean(search);

  return (
    <Box display="flex" gap={1} alignItems="center">
      <TextField
        fullWidth
        label="Buscar páginas"
        placeholder="Buscar por título..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isFiltering && <CircularProgress size={20} sx={{ mr: hasQuery ? 1 : 0 }} />}
              {hasQuery && (
                <Tooltip title="Limpar busca">
                  <IconButton
                    size="small"
                    onClick={() => onSearch('')}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        }}
        inputProps={{ 'aria-label': 'Buscar por título' }}
      />
      <Tooltip title="Recarregar">
        <IconButton
          onClick={onRefresh}
          aria-label="Recarregar lista"
          sx={{
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
