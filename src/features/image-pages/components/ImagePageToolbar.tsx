import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  loading?: boolean;
};

export default function ImagePageToolbar({ search, onSearchChange, loading }: Props) {
  const hasQuery = Boolean(search);

  return (
    <TextField
      fullWidth
      label="Buscar"
      placeholder="Buscar por título..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search sx={{ color: 'text.secondary' }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {loading && <CircularProgress size={20} sx={{ mr: hasQuery ? 1 : 0 }} />}
            {hasQuery && (
              <Tooltip title="Limpar busca">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange('')}
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
      inputProps={{ 'aria-label': 'Buscar páginas de imagens' }}
    />
  );
}
