import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import { Person as PersonIcon, Logout as LogoutIcon } from '@mui/icons-material';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import CompleteProfileAlert from './CompleteProfileAlert';
import { useProfileAlerts } from '@/features/profile/hooks/useProfileAlerts';
import { useAttendancePendings } from '@/features/attendance/hooks';
import { RootState } from '@/store/slices';
import { useLogout } from './useLogout';
import { useRefetchFlagsOnFocus } from '@/features/feature-flags';
import { SHELL_PROFILE_PATH, ShellUserMenuEntryId } from './shellNav';
import { SHELL_USER_MENU_ICONS } from './shellNavIcons';
import { useShellNavigation } from './useShellNavigation';

const NavBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Voltar para a aba releia as flags (uma flag desligada não pode esperar um reload).
  useRefetchFlagsOnFocus();

  const profileAlerts = useProfileAlerts();
  const attendancePendings = useAttendancePendings();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { userMenuEntries } = useShellNavigation();
  const menuEntries = userMenuEntries.filter((entry) => entry.id !== ShellUserMenuEntryId.PROFILE);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isAuthenticated) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenu = () => {
    navigate(SHELL_PROFILE_PATH);
    handleClose();
  };

  const handleEntry = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = useLogout(handleClose);

  return (
    <AppBar position="fixed" sx={{ backgroundColor: '#000000', zIndex: 1300 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component="a"
          href="/"
          sx={{
            color: '#FFFF00',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            fontWeight: 'bold',
            '&:hover': {
              color: '#FFFFFF'
            }
          }}
        >
          Orfanatos NIB
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {isMobile ? (
            <>
              <CompleteProfileAlert alerts={profileAlerts} attendancePendings={attendancePendings} />
              <MobileNavigation />
            </>
          ) : (
            <DesktopNavigation />
          )}
          {!isMobile && (
            <>
              {isAuthenticated ? (
                <>
                  <CompleteProfileAlert alerts={profileAlerts} attendancePendings={attendancePendings} />
                  <Tooltip title="Menu do Usuário">
                    <IconButton
                      onClick={handleProfileClick}
                      sx={{
                        p: 0.5,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 0, 0.1)',
                        },
                        '&:active': {
                          transform: 'scale(0.95)',
                        },
                      }}
                    >
                      <Avatar
                        src={user?.image?.url || undefined}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: '#FFFF00',
                          color: '#000000',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          border: '2px solid #FFFF00',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(255, 255, 0, 0.4)',
                          },
                        }}
                      >
                        {!user?.image?.url ? (user?.name?.charAt(0).toUpperCase() || 'U') : null}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    onClick={handleClose}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        mt: 1.5,
                        minWidth: 220,
                        bgcolor: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 0, 0.2)',
                        '& .MuiMenuItem-root': {
                          color: '#FFFF00',
                          py: 1.5,
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 0, 0.1)',
                          },
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    {menuEntries.map((entry) => {
                      const EntryIcon = SHELL_USER_MENU_ICONS[entry.id];
                      return (
                        <MenuItem
                          key={entry.id}
                          onClick={() => handleEntry(entry.path)}
                          data-testid={`shell-user-menu-${entry.id}`}
                        >
                          <ListItemIcon>
                            <EntryIcon sx={{ color: '#FFFF00', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText>{entry.label}</ListItemText>
                        </MenuItem>
                      );
                    })}
                    <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 1 }} />
                    <MenuItem onClick={handleProfileMenu}>
                      <ListItemIcon>
                        <PersonIcon sx={{ color: '#FFFF00', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText>Meu Perfil</ListItemText>
                    </MenuItem>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 1 }} />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon sx={{ color: '#FF4444', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText sx={{ color: '#FF4444' }}>Sair</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  onClick={handleLogin}
                  variant="contained"
                  sx={{
                    backgroundColor: '#FFFF00',
                    color: '#000000',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    px: 2.5,
                    py: 0.75,
                    '&:hover': {
                      backgroundColor: '#CCCC00',
                    },
                  }}
                >
                  Entrar
                </Button>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
