import { memo } from 'react';
import {
  Badge,
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';

interface AttendanceTabsProps {
  tab: number;
  pendingMemberCount: number;
  pendingLeaderCount: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const a11yProps = (index: number) => ({
  id: `attendance-tab-${index}`,
  'aria-controls': `attendance-tabpanel-${index}`,
});

const AttendanceTabs = memo(({
  tab,
  pendingMemberCount,
  pendingLeaderCount,
  onTabChange,
}: AttendanceTabsProps) => {
  const totalPendings = pendingMemberCount + pendingLeaderCount;

  return (
    <Card variant="outlined" sx={{ mt: 2.5, borderRadius: 3 }}>
      <CardContent sx={{ pb: 0 }}>
        <Tabs
          value={tab}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Abas do controle de presença"
        >
          <Tab
            label="Registrar"
            {...a11yProps(0)}
            aria-label="Aba para registrar presença individual e em lote"
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" gap={1}>
                <span>Pendências</span>
                <Badge
                  badgeContent={totalPendings}
                  color={totalPendings > 0 ? 'error' : 'default'}
                />
              </Stack>
            }
            {...a11yProps(1)}
            aria-label={`Pendências de presença - ${totalPendings} item(ns)`}
          />
          <Tab
            label="Agenda"
            {...a11yProps(2)}
            aria-label="Aba com agenda e eventos do time"
          />
          <Tab
            label="Membros"
            {...a11yProps(3)}
            aria-label="Aba com lista de membros do time"
          />
        </Tabs>
      </CardContent>

      <Divider />
    </Card>
  );
});

AttendanceTabs.displayName = 'AttendanceTabs';

export default AttendanceTabs;
