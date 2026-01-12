import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  IconButton,
  Box,
  Avatar,
  Typography,
  Stack,
  Divider,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import NavLinks from './NavLinks';
import { RootState } from '@/store/slices';
import { logout, UserRole } from '@/store/slices/auth/authSlice';
import api from '@/config/axiosConfig';
import { useIsFeatureEnabled, FeatureFlagKeys } from '@/features/feature-flags';

const MobileNavigation: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
  const isMember = isAuthenticated && user?.role === UserRole.MEMBER;
  const isLeader = isAuthenticated && user?.role === UserRole.LEADER;
  const isPagelasEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_PAGELAS);

  const toggleDrawer = () => setOpen(s => !s);
  const closeDrawer = () => setOpen(false);

  const handleProfileClick = () => {
    navigate('/perfil');
    closeDrawer();
  };

  const handleMemberArea = () => {
    navigate('/area-do-membro');
    closeDrawer();
  };

  const handleShelteredArea = () => {
    navigate('/area-dos-abrigados');
    closeDrawer();
  };

  const handleAdminArea = () => {
    navigate('/adm');
    closeDrawer();
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      dispatch(logout());
      navigate('/');
      closeDrawer();
    }
  };

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <IconButton
        onClick={toggleDrawer}
        sx={{
          color: '#FFFF00',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 0, 0.1)',
            color: '#FFFFFF'
          }
        }}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
      >
        {open ? <CloseIcon fontSize="large" /> : <MenuIcon fontSize="large" />}
      </IconButton>

      <Drawer
        anchor="left"
        open={open}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: '100dvw', sm: 360 },
            maxWidth: '100dvw',
            height: { xs: '100dvh', sm: '100vh' },
            bgcolor: '#000000',
            boxSizing: 'border-box',
            pt: { xs: 'calc(64px + max(env(safe-area-inset-top), 16px))', sm: 'calc(64px + 16px)' },
            pb: 'max(env(safe-area-inset-bottom), 16px)',
            px: 2,
            overflowX: 'hidden',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            zIndex: 1200,
          },
        }}
      >
        {isAuthenticated && user && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 0, 0.1)',
              }}
            >
              <Avatar
                src={user?.image?.url}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: '#FFFF00',
                  color: '#000000',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  border: '3px solid #FFFF00',
                  boxShadow: '0 4px 12px rgba(255, 255, 0, 0.4)',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#FFFF00',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name || 'Usuário'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  {user.role === UserRole.ADMIN && 'Administrador'}
                  {user.role === UserRole.LEADER && 'Líder'}
                  {user.role === UserRole.MEMBER && 'Membro'}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ mb: 2 }}>
              <MenuItem
                onClick={handleMemberArea}
                sx={{
                  color: '#FFFF00',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 0, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <SchoolIcon sx={{ color: '#FFFF00', fontSize: 24 }} />
                </ListItemIcon>
                <ListItemText>Área do Membro</ListItemText>
              </MenuItem>
              {(isMember || isLeader) && isPagelasEnabled && (
                <MenuItem
                  onClick={handleShelteredArea}
                  sx={{
                    color: '#FFFF00',
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 0, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <HomeIcon sx={{ color: '#FFFF00', fontSize: 24 }} />
                  </ListItemIcon>
                  <ListItemText>Área dos Abrigados</ListItemText>
                </MenuItem>
              )}
              {(isAdmin || isLeader) && (
                <MenuItem
                  onClick={handleAdminArea}
                  sx={{
                    color: '#FFFF00',
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 0, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <AdminPanelSettingsIcon sx={{ color: '#FFFF00', fontSize: 24 }} />
                  </ListItemIcon>
                  <ListItemText>Administração</ListItemText>
                </MenuItem>
              )}
              <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 1 }} />
              <MenuItem
                onClick={handleProfileClick}
                sx={{
                  color: '#FFFF00',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 0, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <PersonIcon sx={{ color: '#FFFF00', fontSize: 24 }} />
                </ListItemIcon>
                <ListItemText>Meu Perfil</ListItemText>
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 1 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: '#FF4444',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255, 68, 68, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <LogoutIcon sx={{ color: '#FF4444', fontSize: 24 }} />
                </ListItemIcon>
                <ListItemText>Sair</ListItemText>
              </MenuItem>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', mb: 2 }} />
          </>
        )}
        <NavLinks closeMenu={closeDrawer} isMobile />
        {!isAuthenticated && (
          <Box sx={{ mt: 2, px: 2 }}>
            <Button
              onClick={() => {
                navigate('/login');
                closeDrawer();
              }}
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#FFFF00',
                color: '#000000',
                fontWeight: 'bold',
                textTransform: 'none',
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#CCCC00',
                },
              }}
            >
              Entrar
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default MobileNavigation;
