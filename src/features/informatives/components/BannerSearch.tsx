import React from 'react';
import { CircularProgress, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

type Props = {
  value: string;
  onChange: (v: string) => void;
  loading?: boolean; 
};

export default function BannerSearch({ value, onChange, loading }: Props) {
  const hasQuery = Boolean(value);

  return (
    <TextField
      fullWidth
      label="Buscar banners"
      placeholder="Buscar por título..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
                  onClick={() => onChange('')}
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
    />
  );
}
