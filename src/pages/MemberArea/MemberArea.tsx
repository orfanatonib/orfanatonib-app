import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  BannerSection,
  InformativeBanner,
  MemberContent,
  MemberQuickActions,
} from './components';
import { useMemberArea } from './hooks';
import { useAuthRole } from '@/utils/useAuthRole';
import { getMemberHomeQuickActionKeys } from './utils/navigation';

/**
 * Home: avisos, preparação da semana, acesso rápido, guia e mural.
 * Documentos, ideias, vídeos e demais áreas são subpáginas (sidebar) dentro da casca.
 */
const MemberArea: React.FC = () => {
  const { loading, showWeek, showMeditation } = useMemberArea();
  const { isAdminOrLeader } = useAuthRole();

  return (
    <Box data-testid="member-area-home">
      <InformativeBanner />

      <BannerSection showWeekBanner={showWeek} showMeditationBanner={showMeditation} />

      <Box data-testid="member-area-home-help" sx={{ mb: { xs: 3, md: 4 } }}>
        <MemberQuickActions references={getMemberHomeQuickActionKeys(isAdminOrLeader)} />
      </Box>

      {loading ? (
        <Box
          data-testid="member-area-home-loading"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <CircularProgress size={48} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Carregando sua área...
          </Typography>
        </Box>
      ) : (
        <MemberContent />
      )}
    </Box>
  );
};

export default MemberArea;
