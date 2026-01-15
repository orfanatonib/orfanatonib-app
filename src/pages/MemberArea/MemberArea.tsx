import React from 'react';
import { gradients } from '@/theme';
import {
  Container,
  Typography,
  Paper,
  Divider,
  Box,
  CircularProgress,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/slices';
import {
  InformativeBanner,
  FofinhoButton,
  SpecialFamilyCallout,
  IdeasSharingBanner,
  BannerSection,
  MotivationSection,
  MemberContent,
} from './components';
import { useMemberArea } from './hooks';
import { MOTIVATION_TEXT, CONTAINER_STYLES } from './constants';
import { useAuthRole } from '@/utils/useAuthRole';

const MemberArea: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { loading, showWeek, showMeditation } = useMemberArea();
  const { isAdminOrLeader } = useAuthRole();

  return (
    <Box 
      sx={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #ffffff 100%)',
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(33, 150, 243, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(76, 175, 80, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Container 
        maxWidth={false} 
        sx={{
          ...CONTAINER_STYLES.main,
          position: 'relative',
          zIndex: 1,
        }}
      >
      <InformativeBanner />

      <BannerSection 
        showWeekBanner={showWeek} 
        showMeditationBanner={showMeditation} 
      />

      <Box sx={{ mb: { xs: 4, md: 5 } }}>
        <FofinhoButton
          references={[
            'materials',
            'shelteredrenArea',
            'photos',
            'rate',
            'events',
            'help',
            ...(isAdminOrLeader ? ['integrations'] : [])
          ]}
        />
      </Box>

      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <MotivationSection motivationText={MOTIVATION_TEXT} />
      </Box>

      <Paper 
        elevation={4} 
        sx={{
          ...CONTAINER_STYLES.paper,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2196f3 0%, #4caf50 50%, #ff9800 100%)',
            zIndex: 1,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 4,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                  background: 'linear-gradient(135deg, #2196f3 0%, #4caf50 50%, #ff9800 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                  mb: 0.5,
                }}
              >
                🎓 Área do Membro
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.85rem', md: '1rem' },
                  mt: 0.5,
                  fontWeight: 500,
                }}
              >
                Seu espaço dedicado para materiais, recursos e inspiração
              </Typography>
            </Box>
          </Box>

          <Divider 
            sx={{ 
              my: 0,
              mb: 4,
              borderColor: 'divider',
              borderWidth: 1,
              background: 'linear-gradient(90deg, transparent 0%, rgba(33, 150, 243, 0.3) 50%, transparent 100%)',
            }} 
          />

        {isAuthenticated ? (
          loading ? (
            <Box 
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
          )
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
            }}
          >
            <Typography 
              variant="h6" 
              color="text.primary"
              sx={{ 
                mb: 2,
                fontWeight: 600,
              }}
            >
              🔒 Acesso Restrito
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{
                maxWidth: '500px',
                mx: 'auto',
              }}
            >
              Você precisa estar logado para acessar esta área. Faça login para continuar.
            </Typography>
          </Box>
        )}
        </Box>
      </Paper>
      </Container>
    </Box>
  );
};

export default MemberArea;
