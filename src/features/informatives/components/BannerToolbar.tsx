import React from 'react';
import { Button } from '@mui/material';
import { Add } from '@mui/icons-material';

type Props = { onCreate: () => void };

export default function BannerToolbar({ onCreate }: Props) {
  return (
    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={onCreate}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 600,
        px: 4,
        py: 1.5,
        whiteSpace: 'nowrap',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
        transition: 'all 0.2s ease',
      }}
    >
      Criar Banner
    </Button>
  );
}
