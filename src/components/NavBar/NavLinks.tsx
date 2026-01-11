import React, { Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Stack } from '@mui/material';
import { RootState } from '@/store/slices';
import { logout, UserRole } from '@/store/slices/auth/authSlice';
import api from '@/config/axiosConfig';
import { useIsFeatureEnabled, FeatureFlagKeys } from '@/features/feature-flags';

interface Props {
  closeMenu?: () => void;
  isMobile?: boolean;
}

const NavLinks: React.FC<Props> = ({ closeMenu, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
  const isTeacher = isAuthenticated && user?.role === UserRole.TEACHER;
  const isLeader = isAuthenticated && user?.role === UserRole.LEADER;
  const isShelterManagementEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_MANAGEMENT);

  const handleClick = () => closeMenu?.();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      dispatch(logout());
      navigate('/');
      closeMenu?.();
    }
  };

  const renderLink = (to: string, label: string) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Button
        key={to}
        onClick={() => {
          navigate(to);
          handleClick();
        }}
        variant={active ? 'contained' : 'text'}
        color={active ? 'primary' : 'inherit'}
        fullWidth={!!isMobile}
        sx={{
          justifyContent: isMobile ? 'flex-start' : 'center',
          fontWeight: 'bold',
          fontSize: { xs: '0.9rem', md: '0.85rem', lg: '0.9rem' },
          color: isMobile
            ? (active ? '#000000' : '#FFFF00')
            : (active ? '#000000' : '#FFFF00'),
          backgroundColor: active ? '#FFFF00' : 'transparent',
          ...(active && !isMobile ? { boxShadow: 'none' } : null),
          minHeight: { xs: 44, md: 40 },
          px: { xs: 2, md: 1.5 },
          textTransform: 'none',
          maxWidth: '100%',
          whiteSpace: 'nowrap',
          borderRadius: isMobile && active ? 1 : 0,
          '&:hover': {
            backgroundColor: isMobile
              ? (active ? '#CCCC00' : 'rgba(255, 255, 0, 0.1)')
              : (active ? '#CCCC00' : 'rgba(255, 255, 0, 0.1)'),
            color: isMobile
              ? (active ? '#000000' : '#FFFFFF')
              : (active ? '#000000' : '#FFFFFF')
          }
        }}
      >
        {label}
      </Button>
    );
  };

  return (
    <Stack
      direction={isMobile ? 'column' : 'row'}
      spacing={isMobile ? 1.5 : 2}
      alignItems={isMobile ? 'stretch' : 'center'}
      mt={isMobile ? 6 : 0}
      sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}
    >
      {renderLink('/', 'Início')}
      {renderLink('/feed-abrigos', 'Feed')}
      {renderLink('/sobre', 'Sobre')}
      {renderLink('/eventos', 'Eventos')}
      {renderLink('/contato', 'Contato')}
    </Stack>
  );
};

export default NavLinks;
