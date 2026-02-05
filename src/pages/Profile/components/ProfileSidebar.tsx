import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Stack,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoCameraIcon,
  HomeOutlined as HomeOutlinedIcon,
  GroupsOutlined as GroupsOutlinedIcon,
  Badge as BadgeIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';

const menuItems = [
  { icon: <PersonIcon />, label: 'Informações da Conta', shortLabel: 'Conta' },
  { icon: <BadgeIcon />, label: 'Dados Pessoais', shortLabel: 'Pessoais' },
  { icon: <FavoriteIcon />, label: 'Minhas Preferências', shortLabel: 'Preferências' },
  { icon: <LockIcon />, label: 'Alterar Senha', shortLabel: 'Senha' },
  { icon: <PhotoCameraIcon />, label: 'Foto de Perfil', shortLabel: 'Foto' },
];

interface Profile {
  name?: string;
  email?: string;
  role?: string;
  image?: {
    url?: string;
  } | null;
}

interface ProfileSidebarProps {
  profile: Profile | null;
  user: any;
  selectedMenu: number;
  onMenuClick: (index: number) => void;
  onImageClick: (url: string) => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  user,
  selectedMenu,
  onMenuClick,
  onImageClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const renderTooltipContent = (shelter: any) => {
    if (!shelter?.address) return shelter?.name || '';
    return (
      <Box>
        <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
          {shelter.name}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          {shelter.address.street}, {shelter.address.number}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          {shelter.address.district} - {shelter.address.city}/{shelter.address.state}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          CEP: {shelter.address.postalCode}
        </Typography>
      </Box>
    );
  };

  const tooltipProps = {
    arrow: true,
    placement: isMobile ? 'bottom' as const : 'right' as const,
    enterTouchDelay: 0,
    leaveTouchDelay: 3000,
    componentsProps: {
      tooltip: {
        sx: {
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid rgba(25, 118, 210, 0.2)',
          p: 1.5,
          maxWidth: { xs: 280, sm: 320 },
          '& .MuiTooltip-arrow': {
            color: 'white',
            '&::before': {
              border: '1px solid rgba(25, 118, 210, 0.2)',
            },
          },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Paper
        elevation={3}
        sx={{
          width: { xs: '100%', md: 240, lg: 260 },
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 255, 0.98) 100%)',
          border: '1px solid rgba(25, 118, 210, 0.1)',
          flexShrink: 0,
        }}
      >
        {/* Header com Avatar */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Avatar
            src={profile?.image?.url}
            onClick={() => profile?.image?.url && onImageClick(profile.image.url)}
            sx={{
              width: { xs: 60, sm: 70, md: 80 },
              height: { xs: 60, sm: 70, md: 80 },
              fontSize: { xs: '1.5rem', md: '2rem' },
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              cursor: profile?.image?.url ? 'pointer' : 'default',
            }}
          >
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                color: 'white',
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                lineHeight: 1.3,
              }}
            >
              {profile?.name || 'Carregando...'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.7rem',
                display: 'block',
                wordBreak: 'break-all',
              }}
            >
              {profile?.email}
            </Typography>
          </Box>
        </Box>

        {/* Info de equipe para membros */}
        {profile?.role === 'member' && user?.memberProfile?.team?.shelter && (
          <Tooltip title={renderTooltipContent(user.memberProfile.team.shelter)} {...tooltipProps}>
            <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'rgba(25, 118, 210, 0.05)', cursor: 'pointer' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <HomeOutlinedIcon sx={{ fontSize: 16 }} color="primary" />
                  <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.3 }} noWrap>
                    {user.memberProfile.team.shelter.name}
                  </Typography>
                </Stack>
                <Chip
                  icon={<GroupsOutlinedIcon />}
                  label={`Equipe ${user.memberProfile.team.numberTeam}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, height: 24, '& .MuiChip-label': { px: 1 }, alignSelf: 'flex-start' }}
                />
              </Stack>
            </Box>
          </Tooltip>
        )}

        {/* Info de equipes para líderes */}
        {profile?.role === 'leader' && user?.leaderProfile?.teams && user.leaderProfile.teams.length > 0 && (
          <Box sx={{ px: 1.5, py: 1.5, bgcolor: 'rgba(25, 118, 210, 0.05)', maxHeight: { xs: 150, sm: 200 }, overflowY: 'auto' }}>
            <Typography variant="caption" fontWeight={700} color="primary" sx={{ display: 'block', mb: 1 }}>
              Minhas Equipes ({user.leaderProfile.teams.length})
            </Typography>
            <Stack spacing={1}>
              {user.leaderProfile.teams.map((team: any) => (
                <Tooltip key={team.id} title={renderTooltipContent(team.shelter)} {...tooltipProps}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'white',
                      border: '1px solid rgba(25, 118, 210, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                      },
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <HomeOutlinedIcon sx={{ fontSize: 14 }} color="primary" />
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', lineHeight: 1.2 }} noWrap>
                          {team.shelter?.name}
                        </Typography>
                      </Stack>
                      <Chip
                        icon={<GroupsOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                        label={`Equipe ${team.numberTeam}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 }, alignSelf: 'flex-start' }}
                      />
                    </Stack>
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        )}

        <Divider />

        {/* Menu de navegação */}
        <List sx={{ p: 0.5 }} dense>
          {menuItems.map((item, index) => (
            <ListItemButton
              key={index}
              selected={selectedMenu === index}
              onClick={() => onMenuClick(index)}
              sx={{
                borderRadius: 1.5,
                mb: 0.25,
                py: 0.75,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: selectedMenu === index ? 'white' : 'primary.main',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={isSmall ? item.shortLabel : item.label}
                primaryTypographyProps={{
                  fontWeight: selectedMenu === index ? 700 : 500,
                  fontSize: '0.8rem',
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </motion.div>
  );
};

export { menuItems };
export default ProfileSidebar;
