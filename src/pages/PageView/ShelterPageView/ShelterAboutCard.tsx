import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { OpenInNew, PlaceOutlined } from '@mui/icons-material';

import type { AddressResponseDto } from '@/features/shelters/types';
import { fmtDate } from '@/utils/dateUtils';

import { SHELTER_ACCENT, SHELTER_ACCENT_DARK, SHELTER_ACCENT_SOFT } from './constants';
import { buildAddressLines, buildMapsUrl } from './utils';

type Props = { address: AddressResponseDto; updatedAt: string };

/** Endereço em texto corrido, botão para o mapa e a data da última atualização. */
const ShelterAboutCard: React.FC<Props> = ({ address, updatedAt }) => {
  const { line1, line2, postalCode, complement } = buildAddressLines(address);

  return (
    <Box
      data-testid="shelter-location"
      component="section"
      sx={{ bgcolor: '#fff', border: '1px solid #f1e3d0', borderRadius: 3, p: { xs: 2, md: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: SHELTER_ACCENT_SOFT, color: SHELTER_ACCENT_DARK }}>
          <PlaceOutlined />
        </Box>
        <Typography component="h2" sx={{ fontWeight: 900, fontSize: '1.15rem', color: '#1f2d3d' }}>
          Onde fica
        </Typography>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#1f2d3d', wordBreak: 'break-word' }}>{line1}</Typography>
      <Typography sx={{ color: '#475569', wordBreak: 'break-word' }}>{line2}</Typography>
      {complement && <Typography sx={{ color: '#475569', mt: 0.25 }}>{complement}</Typography>}
      {postalCode && (
        <Typography sx={{ mt: 0.75, color: '#6b7280', fontWeight: 700, fontSize: '0.85rem' }}>CEP {postalCode}</Typography>
      )}

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button
          data-testid="shelter-open-map"
          component="a"
          href={buildMapsUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          endIcon={<OpenInNew />}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            minHeight: 46,
            px: 3,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: SHELTER_ACCENT,
            color: '#fff',
            boxShadow: '0 8px 18px rgba(255,152,0,0.35)',
            '&:hover': { bgcolor: SHELTER_ACCENT_DARK },
          }}
        >
          Abrir no mapa
        </Button>
        <Typography sx={{ mt: 1.5, color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
          Atualizado em {fmtDate(updatedAt)}
        </Typography>
      </Box>
    </Box>
  );
};

export default ShelterAboutCard;
