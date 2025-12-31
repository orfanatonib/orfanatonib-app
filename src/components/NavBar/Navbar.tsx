import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import { RootState } from '@/store/slices';
import { logout, UserRole } from '@/store/slices/auth/authSlice';
import api from '@/config/axiosConfig';

const NavBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
  const isTeacher = isAuthenticated && user?.role === UserRole.TEACHER;
  const isLeader = isAuthenticated && user?.role === UserRole.LEADER;

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isAuthenticated) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenu = () => {
    navigate('/perfil');
    handleClose();
  };

  const handleTeacherArea = () => {
    navigate('/area-do-membro');
    handleClose();
  };

  const handleShelteredArea = () => {
    navigate('/area-dos-abrigados');
    handleClose();
  };

  const handleAdminArea = () => {
    navigate('/adm');
    handleClose();
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      dispatch(logout());
      navigate('/');
      handleClose();
    }
  };

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
            fontWeight: 'bold',
            '&:hover': {
              color: '#FFFFFF'
            }
          }}
        >
          Orfanatos NIB
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {isMobile ? <MobileNavigation /> : <DesktopNavigation />}
          {!isMobile && (
            <>
              {isAuthenticated ? (
                <>
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
                        src={(user as any)?.image?.url}
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
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
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
                    <MenuItem onClick={handleTeacherArea}>
                      <ListItemIcon>
                        <SchoolIcon sx={{ color: '#FFFF00', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText>Área do Membro</ListItemText>
                    </MenuItem>
                    {isTeacher && (
                      <MenuItem onClick={handleShelteredArea}>
                        <ListItemIcon>
                          <HomeIcon sx={{ color: '#FFFF00', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText>Área dos Abrigados</ListItemText>
                      </MenuItem>
                    )}
                    {(isAdmin || isLeader) && (
                      <MenuItem onClick={handleAdminArea}>
                        <ListItemIcon>
                          <AdminIcon sx={{ color: '#FFFF00', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText>Administração</ListItemText>
                      </MenuItem>
                    )}
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
