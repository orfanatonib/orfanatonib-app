import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ATTENDANCE_PATHS } from "../constants";
import { adminWorkspaceBleedSx, adminWorkspaceContentSx } from "@/theme/adminWorkspace";
import { attendanceColors } from "@/theme/attendance";
import UnsavedChangesDialog from "@/components/common/modal/UnsavedChangesDialog";
import { hasUnsavedChanges } from "@/utils/unsavedChanges";

export default function AttendanceLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const active = pathname.startsWith(ATTENDANCE_PATHS.history)
    ? ATTENDANCE_PATHS.history
    : pathname.startsWith(ATTENDANCE_PATHS.pending)
      ? ATTENDANCE_PATHS.pending
      : ATTENDANCE_PATHS.register;
  const go = (path: string) => {
    if (busy || path === pathname) return;
    if (hasUnsavedChanges()) setPendingPath(path);
    else navigate(path);
  };
  return (
    <Box
      data-testid="attendance-workspace"
      sx={{
        ...adminWorkspaceBleedSx,
        bgcolor: attendanceColors.background,
        py: { xs: 1.5, sm: 3 },
        minHeight: "70vh",
      }}
    >
      <Box
        data-testid="attendance-content"
        sx={adminWorkspaceContentSx}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontSize: { xs: "1.55rem", md: "2rem" },
            fontWeight: 800,
            color: attendanceColors.ink,
          }}
        >
          Presença das equipes
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 0.75, mb: 2, color: attendanceColors.muted }}
        >
          Registre os encontros, consulte o histórico e acompanhe o que falta
          preencher.
        </Typography>
        <Tabs
          value={active}
          onChange={(_, value: string) => go(value)}
          variant="fullWidth"
          aria-label="Páginas de presença"
          sx={{
            mb: 3,
            borderBottom: "1px solid",
            borderColor: attendanceColors.border,
            "& .MuiTab-root": {
              minWidth: 0,
              minHeight: 48,
              px: 1,
              textTransform: "none",
              color: attendanceColors.muted,
            },
            "& .MuiTab-root.Mui-selected": { color: attendanceColors.accent },
            "& .MuiTabs-indicator": { bgcolor: attendanceColors.accent },
          }}
        >
          <Tab
            data-testid="attendance-mode-register"
            value={ATTENDANCE_PATHS.register}
            label="Lançar presença"
            disabled={busy}
          />
          <Tab
            data-testid="attendance-mode-list"
            value={ATTENDANCE_PATHS.history}
            label="Consultar"
            disabled={busy}
          />
          <Tab
            value={ATTENDANCE_PATHS.pending}
            label="Pendências"
            disabled={busy}
          />
        </Tabs>
        <Outlet context={{ setBusy }} />
      </Box>
      <UnsavedChangesDialog
        open={pendingPath !== null}
        onStay={() => setPendingPath(null)}
        onLeave={() => {
          if (pendingPath) navigate(pendingPath);
          setPendingPath(null);
        }}
      />
    </Box>
  );
}
