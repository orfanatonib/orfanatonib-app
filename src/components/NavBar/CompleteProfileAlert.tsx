
import React, { useState } from 'react';
import { IconButton, Tooltip, Badge, Menu, MenuItem, ListItemText } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useNavigate } from 'react-router-dom';

export interface ProfileAlert {
  id: string;
  message: string;
  to?: string; // optional redirect path
}

export interface CompleteProfileAlertProps {
  alerts: ProfileAlert[];
}

const CompleteProfileAlert: React.FC<CompleteProfileAlertProps> = ({ alerts }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!alerts || alerts.length === 0) return null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAlertClick = (to?: string) => {
    handleClose();
    if (to) navigate(to);
  };

  return (
    <>
      <Tooltip title={alerts.length === 1 ? alerts[0].message : 'Você tem alertas do perfil'} arrow>
        <IconButton
          color="warning"
          onClick={handleClick}
          sx={{ ml: 1, p: 0.5 }}
        >
          <Badge color="error" variant="dot" overlap="circular" badgeContent={alerts.length}>
            <NotificationsActiveIcon sx={{ fontSize: 26, color: '#FFD600' }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 260,
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 0, 0.2)',
            '& .MuiMenuItem-root': {
              color: '#FFD600',
              py: 1.2,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 0, 0.08)',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {alerts.map((alert) => (
          <MenuItem key={alert.id} onClick={() => handleAlertClick(alert.to)}>
            <ListItemText>{alert.message}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CompleteProfileAlert;
