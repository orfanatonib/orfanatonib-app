import React, { Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Stack } from '@mui/material';
import { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';
import { useLogout } from './useLogout';
import { useIsFeatureEnabled, FeatureFlagKeys } from '@/features/feature-flags';
import { visiblePublicNavItems } from './publicNav';

interface Props {
  closeMenu?: () => void;
  isMobile?: boolean;
}

const NavLinks: React.FC<Props> = ({ closeMenu, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
  const isMember = isAuthenticated && user?.role === UserRole.MEMBER;
  const isLeader = isAuthenticated && user?.role === UserRole.LEADER;
  const isShelterManagementEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTERED_MANAGEMENT);
  const feedEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_FEED);
  const aboutEnabled = useIsFeatureEnabled(FeatureFlagKeys.ABOUT_PAGE);
  const eventsEnabled = useIsFeatureEnabled(FeatureFlagKeys.EVENTS_SECTION);
  const contactEnabled = useIsFeatureEnabled(FeatureFlagKeys.CONTACT_FORM);
  const publicEnabled: Partial<Record<FeatureFlagKeys, boolean>> = {
    [FeatureFlagKeys.SHELTER_FEED]: feedEnabled,
    [FeatureFlagKeys.ABOUT_PAGE]: aboutEnabled,
    [FeatureFlagKeys.EVENTS_SECTION]: eventsEnabled,
    [FeatureFlagKeys.CONTACT_FORM]: contactEnabled,
  };

  const handleClick = () => closeMenu?.();

  const handleLogout = useLogout(closeMenu);

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
      {visiblePublicNavItems((flag) => publicEnabled[flag] === true).map((item) => renderLink(item.to, item.label))}
    </Stack>
  );
};

export default NavLinks;
