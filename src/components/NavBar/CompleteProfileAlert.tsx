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
import {
  InboxSection,
  NOTIFICATIONS_BADGE_MAX,
  bellCount,
  notificationRoute,
  useInboxAccess,
  useInboxList,
  useInboxMutations,
  useInboxSummary,
  type InboxNotificationDto,
} from '@/features/notifications';
import { NOTIFICATION_FAINT_COLOR, NOTIFICATION_MUTED_COLOR } from './completeProfileAlert/constants';

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
  const inboxAccess = useInboxAccess();
  const summary = useInboxSummary(inboxAccess.userId, inboxAccess.enabled);
  const inboxList = useInboxList(inboxAccess.userId, inboxAccess.enabled, Boolean(anchorEl), summary.data);
  const { markRead, markAllRead } = useInboxMutations(inboxAccess.userId);
  const unreadCount = summary.data?.unreadCount ?? 0;
  const inboxTotal = summary.data?.total ?? 0;
  const badgeCount = bellCount(unreadCount, alerts.length + pendingCount);
  const form = useAttendancePendingForm(memberPendings, attendancePendings);

  const closeMenu = () => setAnchorEl(null);
  const goTo = (route: string) => {
    closeMenu();
    navigate(route);
  };

  const hasInbox = inboxAccess.enabled && inboxTotal > 0;
  const openNotice = (notice: InboxNotificationDto) => {
    if (notice.readAt === null) markRead.mutate(notice.id);
    const route = notificationRoute(notice.type, notice.target);
    if (route) {
      closeMenu();
      navigate(route);
    }
  };

  if ((!alerts || alerts.length === 0) && pendingCount === 0 && !hasInbox) return null;

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
          <Badge color="error" overlap="circular" badgeContent={badgeCount} max={NOTIFICATIONS_BADGE_MAX} data-testid="notifications-count">
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
        inbox={
          hasInbox ? (
            <InboxSection
              data={inboxList.data}
              unreadCount={unreadCount}
              loading={inboxList.isPending}
              failed={inboxList.isError}
              hasMore={Boolean(inboxList.hasNextPage)}
              loadingMore={inboxList.isFetchingNextPage}
              busy={markAllRead.isPending}
              colors={{ text: NOTIFICATION_COLOR, muted: NOTIFICATION_MUTED_COLOR, faint: NOTIFICATION_FAINT_COLOR }}
              onOpen={openNotice}
              onMarkAll={() => markAllRead.mutate()}
              onLoadMore={() => void inboxList.fetchNextPage()}
              onRetry={() => void inboxList.refetch()}
            />
          ) : null
        }
      />

      {isMember && (
        <PendingAttendanceDialog form={form} pendings={memberPendings} loading={attendancePendings?.loading || false} isMobile={isMobile} />
      )}
    </>
  );
};

export default CompleteProfileAlert;
