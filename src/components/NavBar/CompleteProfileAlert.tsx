import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Badge, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useNavigate } from 'react-router-dom';
import type { RootState as RootStateType } from '@/store/slices';
import NotificationsMenu from './completeProfileAlert/NotificationsMenu';
import PendingAttendanceDialog from './completeProfileAlert/PendingAttendanceDialog';
import { ALERT_TEXTS, LEADER_PENDINGS_ROUTE, NOTIFICATION_COLOR, VISIT_REPORT_PENDINGS_ROUTE } from './completeProfileAlert/constants';
import type { CompleteProfileAlertProps } from './completeProfileAlert/types';
import { useAttendancePendingForm } from './completeProfileAlert/useAttendancePendingForm';
import { isMemberRole, resolvePendingCounts, totalPendingCount } from './completeProfileAlert/utils';

export type {
  AttendancePendingsProps,
  CompleteProfileAlertProps,
  ProfileAlert,
} from './completeProfileAlert/types';

const CompleteProfileAlert: React.FC<CompleteProfileAlertProps> = ({ alerts, attendancePendings, onAlertClick }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { isAuthenticated, user } = useSelector((state: RootStateType) => state.auth);

  const isMember = isMemberRole(isAuthenticated, user?.role);
  const memberPendings = attendancePendings?.memberPendings || [];
  const counts = resolvePendingCounts(attendancePendings);
  const pendingCount = totalPendingCount(counts, isMember);
  const badgeCount = alerts.length + pendingCount;
  const form = useAttendancePendingForm(memberPendings, attendancePendings);

  const closeMenu = () => setAnchorEl(null);
  const goTo = (route: string) => {
    closeMenu();
    navigate(route);
  };

  if ((!alerts || alerts.length === 0) && pendingCount === 0) return null;

  return (
    <>
      <Tooltip title={badgeCount > 0 ? ALERT_TEXTS.tooltipWithAlerts : ALERT_TEXTS.tooltipEmpty} arrow>
        <IconButton
          color="warning"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{ ml: 1, p: 0.5, minWidth: 44, minHeight: 44 }}
          data-testid="notifications-button"
          aria-label={ALERT_TEXTS.menuTitle}
        >
          <Badge color="error" overlap="circular" badgeContent={badgeCount}>
            <NotificationsActiveIcon sx={{ fontSize: 26, color: NOTIFICATION_COLOR }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationsMenu
        anchorEl={anchorEl}
        onClose={closeMenu}
        alerts={alerts ?? []}
        counts={counts}
        pendingCount={pendingCount}
        isMember={isMember}
        onAlert={(to) => {
          closeMenu();
          onAlertClick?.();
          if (to) navigate(to);
        }}
        onOpenMemberPendings={() => {
          form.open();
          closeMenu();
        }}
        onOpenLeaderPendings={() => goTo(LEADER_PENDINGS_ROUTE)}
        onOpenVisitReports={() => goTo(VISIT_REPORT_PENDINGS_ROUTE)}
      />

      {isMember && (
        <PendingAttendanceDialog form={form} pendings={memberPendings} loading={attendancePendings?.loading || false} isMobile={isMobile} />
      )}
    </>
  );
};

export default CompleteProfileAlert;
