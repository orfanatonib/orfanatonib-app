import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NavLinks from './NavLinks';
import { RootState } from '@/store/slices';
import { useLogout } from './useLogout';
import { getRoleLabel, SHELL_LOGIN_PATH, SHELL_PROFILE_PATH, ShellUserMenuEntryId } from './shellNav';
import { SHELL_USER_MENU_ICONS } from './shellNavIcons';
import { useShellNavigation } from './useShellNavigation';

const MobileNavigation: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const { userMenuEntries } = useShellNavigation();
  const menuEntries = userMenuEntries.filter((entry) => entry.id !== ShellUserMenuEntryId.PROFILE);

  const toggleDrawer = () => setOpen(s => !s);
  const closeDrawer = () => setOpen(false);

  const handleProfileClick = () => {
    navigate(SHELL_PROFILE_PATH);
    closeDrawer();
  };

  const handleEntry = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  const handleLogout = useLogout(closeDrawer);

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
                  {getRoleLabel(user.role)}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ mb: 2 }}>
              {menuEntries.map((entry) => {
                const EntryIcon = SHELL_USER_MENU_ICONS[entry.id];
                return (
                  <MenuItem
                    key={entry.id}
                    onClick={() => handleEntry(entry.path)}
                    data-testid={`shell-mobile-menu-${entry.id}`}
                    sx={{
                      color: '#FFFF00',
                      py: 1.5,
                      minHeight: 44,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 0, 0.1)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <EntryIcon sx={{ color: '#FFFF00', fontSize: 24 }} />
                    </ListItemIcon>
                    <ListItemText>{entry.label}</ListItemText>
                  </MenuItem>
                );
              })}
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
                navigate(SHELL_LOGIN_PATH);
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
