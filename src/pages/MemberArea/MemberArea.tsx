import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/slices';
import {
  BannerSection,
  InformativeBanner,
  MemberContent,
  MemberQuickActions,
} from './components';
import { useMemberArea } from './hooks';
import { MEMBER_HOME_QUICK_ACTIONS } from './constants/navigation';

/**
 * Home enxuta: só avisos, banners da semana, atalho de ajuda e o conteúdo de boas-vindas.
 * Documentos, ideias, vídeos e demais áreas são subpáginas (sidebar) dentro da casca.
 */
const MemberArea: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading, showWeek, showMeditation } = useMemberArea();

  return (
    <Box data-testid="member-area-home">
      <InformativeBanner />

      <BannerSection showWeekBanner={showWeek} showMeditationBanner={showMeditation} />

      <Box data-testid="member-area-home-help" sx={{ mb: { xs: 3, md: 4 } }}>
        <MemberQuickActions references={[...MEMBER_HOME_QUICK_ACTIONS]} />
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
        <MemberContent userName={user?.name} />
      )}
    </Box>
  );
};

export default MemberArea;
