import React from 'react';
import { Box, Chip, Divider, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import {
  ALERT_TEXTS,
  MENU_PAPER_SX,
  NOTIFICATION_COLOR,
  NOTIFICATION_FAINT_COLOR,
  NOTIFICATION_ITEM_SX,
  NOTIFICATION_MUTED_COLOR,
  NOTIFICATION_SCROLLBAR_SX,
} from './constants';
import type { PendingCounts, ProfileAlert } from './types';
import { pendingEventsLabel } from './utils';

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  alerts: ProfileAlert[];
  counts: PendingCounts;
  pendingCount: number;
  isMember: boolean;
  onAlert: (to?: string) => void;
  onOpenMemberPendings: () => void;
  onOpenLeaderPendings: () => void;
  onOpenVisitReports: () => void;
  /** Avisos da caixa de entrada (Estúdios etc.), acima das pendências; `null` quando não se aplica. */
  inbox?: React.ReactNode;
}

interface PendingItemProps {
  testId: string;
  icon: React.ReactNode;
  title: string;
  count: number;
  chipSx: SxProps<Theme>;
  secondary: string;
  onClick: () => void;
  sx?: SxProps<Theme>;
}

const PendingItem: React.FC<PendingItemProps> = ({ testId, icon, title, count, chipSx, secondary, onClick, sx }) => (
  <MenuItem onClick={onClick} data-testid={testId} sx={{ ...NOTIFICATION_ITEM_SX, ...sx } as SxProps<Theme>}>
    <Box sx={{ mr: 1.5, color: NOTIFICATION_COLOR }}>{icon}</Box>
    <ListItemText
      primary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%' }}>
          <Typography variant="body2" sx={{ color: NOTIFICATION_COLOR, fontWeight: 600, fontSize: '0.875rem', flex: '1 1 auto', minWidth: 0 }}>
            {title}
          </Typography>
          <Chip label={count} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0, ...(chipSx as object) }} />
        </Box>
      }
      secondary={
        <Typography variant="caption" sx={{ color: NOTIFICATION_MUTED_COLOR, fontSize: '0.75rem', mt: 0.5, display: 'block', wordBreak: 'break-word', whiteSpace: 'normal', width: '100%' }}>
          {secondary}
        </Typography>
      }
    />
  </MenuItem>
);

const NotificationsMenu: React.FC<Props> = ({
  anchorEl,
  onClose,
  alerts,
  counts,
  pendingCount,
  isMember,
  onAlert,
  onOpenMemberPendings,
  onOpenLeaderPendings,
  onOpenVisitReports,
  inbox = null,
}) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    PaperProps={{ elevation: 8, sx: MENU_PAPER_SX }}
    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    MenuListProps={{ sx: { py: 1, overflowX: 'hidden', width: '100%' } }}
    data-testid="notifications-menu"
  >
    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 0, 0.2)', bgcolor: 'rgba(255, 255, 0, 0.05)' }}>
      <Typography variant="subtitle2" sx={{ color: NOTIFICATION_COLOR, fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {ALERT_TEXTS.menuTitle}
      </Typography>
    </Box>

    <Box sx={{ maxHeight: 'calc(75vh - 60px)', overflowY: 'auto', overflowX: 'hidden', ...NOTIFICATION_SCROLLBAR_SX }}>
      {inbox}

      {inbox && (alerts.length > 0 || pendingCount > 0) && (
        <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 0.5 }} />
      )}

      {alerts.map((alert) => (
        <MenuItem key={alert.id} onClick={() => onAlert(alert.to)} data-testid="notifications-alert-item" sx={{ ...NOTIFICATION_ITEM_SX, width: '100%', overflow: 'hidden' } as SxProps<Theme>}>
          <ListItemText
            sx={{ width: '100%', minWidth: 0, margin: 0 }}
            primary={
              <Typography variant="body2" sx={{ color: NOTIFICATION_COLOR, fontWeight: 500, fontSize: '0.875rem', wordBreak: 'break-word', whiteSpace: 'normal', maxWidth: '100%', width: '100%' }}>
                {alert.message}
              </Typography>
            }
          />
        </MenuItem>
      ))}

      {alerts.length > 0 && pendingCount > 0 && <Divider sx={{ borderColor: 'rgba(255, 255, 0, 0.2)', my: 0.5 }} />}

      {isMember && pendingCount > 0 && (
        <PendingItem
          testId="notifications-member-pendings"
          icon={<EventAvailableIcon fontSize="small" />}
          title={ALERT_TEXTS.pendingsTitle}
          count={pendingCount}
          chipSx={{ bgcolor: 'error.main', color: 'white' }}
          secondary={pendingEventsLabel(pendingCount)}
          onClick={onOpenMemberPendings}
        />
      )}

      {counts.leader > 0 && (
        <PendingItem
          testId="notifications-leader-pendings"
          icon={<AssignmentIcon fontSize="small" />}
          title={ALERT_TEXTS.pendingsTitle}
          count={counts.leader}
          chipSx={{ bgcolor: 'error.main', color: 'white' }}
          secondary={ALERT_TEXTS.clickToView}
          onClick={onOpenLeaderPendings}
          sx={{ mb: 1 }}
        />
      )}

      {counts.visitReport > 0 && (
        <PendingItem
          testId="notifications-visit-report-pendings"
          icon={<DescriptionIcon fontSize="small" />}
          title={ALERT_TEXTS.visitReportsTitle}
          count={counts.visitReport}
          chipSx={{ bgcolor: 'warning.main', color: 'black' }}
          secondary={ALERT_TEXTS.clickToView}
          onClick={onOpenVisitReports}
        />
      )}

      {!inbox && alerts.length === 0 && pendingCount === 0 && (
        <Box sx={{ px: 2, py: 3, textAlign: 'center' }} data-testid="notifications-empty">
          <Typography variant="body2" sx={{ color: NOTIFICATION_FAINT_COLOR, fontSize: '0.875rem' }}>
            {ALERT_TEXTS.empty}
          </Typography>
        </Box>
      )}
    </Box>
  </Menu>
);

export default NotificationsMenu;
