import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Collapse,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ArrowForward from "@mui/icons-material/ArrowForward";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import type { AttendanceTeamSelectionProps } from "../workspace.types";
import { ATTENDANCE_TOUCH_SIZE } from "../constants";
import { attendanceColors } from "@/theme/attendance";

const GRID_SX = {
  display: "grid",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    md: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(3, minmax(0, 1fr))",
  },
  gap: { xs: 1.5, md: 2 },
  alignItems: "start",
} as const;

const TEAM_GRID_SX = {
  display: "grid",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    sm: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(3, minmax(0, 1fr))",
  },
  gap: 1.25,
  p: { xs: 1.5, md: 2 },
} as const;

export default function TeamSelection({
  data,
  loading,
  onTeamSelect,
  searchTerm,
}: AttendanceTeamSelectionProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    // Um único abrigo (ou busca ativa que o isolou) já chega aberto: menos um toque.
    if (data.length === 1) setOpen(new Set([data[0].shelterId]));
  }, [data, searchTerm]);
  const toggle = (shelterId: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(shelterId)) next.add(shelterId);
      return next;
    });
  if (loading)
    return (
      <Box sx={GRID_SX} data-testid="attendance-loading">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} variant="rounded" height={96} />
        ))}
      </Box>
    );
  if (!data.length)
    return (
      <Alert data-testid="attendance-empty" severity="info">
        {searchTerm
          ? "Nenhum abrigo ou equipe corresponde à busca."
          : "Nenhuma equipe disponível para seu acesso."}
      </Alert>
    );
  return (
    <Box data-testid="attendance-shelters" sx={GRID_SX}>
      {data.map((shelter) => {
        const isOpen = open.has(shelter.shelterId);
        const members = shelter.teams.reduce(
          (total, team) => total + team.members.length,
          0,
        );
        return (
          <Paper
            key={shelter.shelterId}
            data-testid={`attendance-shelter-${shelter.shelterId}`}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: isOpen
                ? attendanceColors.accent
                : attendanceColors.border,
              borderRadius: 3,
              overflow: "hidden",
              minWidth: 0,
              gridColumn: isOpen ? "1 / -1" : "auto",
              bgcolor: attendanceColors.surface,
            }}
          >
            <Box
              component="button"
              type="button"
              data-testid={`attendance-shelter-toggle-${shelter.shelterId}`}
              aria-expanded={isOpen}
              onClick={() => toggle(shelter.shelterId)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                width: "100%",
                minHeight: 80,
                p: { xs: 1.5, md: 2 },
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                bgcolor: isOpen ? attendanceColors.soft : "transparent",
                "&:hover": { bgcolor: attendanceColors.soft },
                "&:focus-visible": {
                  outline: `3px solid ${attendanceColors.accent}`,
                  outlineOffset: -3,
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: attendanceColors.accent,
                  width: 44,
                  height: 44,
                }}
              >
                {shelter.shelterName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  fontWeight={800}
                  sx={{ color: attendanceColors.ink, overflowWrap: "anywhere" }}
                >
                  {shelter.shelterName}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
                  <Chip
                    size="small"
                    icon={<GroupsOutlined />}
                    label={`${shelter.teams.length} equipe(s)`}
                  />
                  <Chip size="small" variant="outlined" label={`${members} membro(s)`} />
                </Box>
              </Box>
              <ExpandMore
                sx={{
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform .2s",
                  color: attendanceColors.muted,
                }}
              />
            </Box>
            <Collapse in={isOpen} unmountOnExit>
              <Box sx={TEAM_GRID_SX}>
                {shelter.teams.map((team) => (
                  <Box
                    component="button"
                    type="button"
                    key={team.teamId}
                    data-testid={`attendance-team-${team.teamId}`}
                    onClick={() => onTeamSelect(shelter, team)}
                    sx={{
                      all: "unset",
                      boxSizing: "border-box",
                      minHeight: ATTENDANCE_TOUCH_SIZE + 40,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: attendanceColors.border,
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: attendanceColors.soft,
                        borderColor: attendanceColors.accent,
                      },
                      "&:focus-visible": {
                        outline: `3px solid ${attendanceColors.accent}`,
                      },
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: attendanceColors.soft,
                        color: attendanceColors.accent,
                        fontWeight: 800,
                      }}
                    >
                      {team.teamNumber}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography fontWeight={800} sx={{ color: attendanceColors.ink }}>
                        Equipe {team.teamNumber}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        {team.description || "Sem descrição"} ·{" "}
                        {team.members.length} membro(s)
                      </Typography>
                    </Box>
                    <Typography
                      component="span"
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        color: attendanceColors.accent,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      Lançar <ArrowForward fontSize="small" />
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Paper>
        );
      })}
    </Box>
  );
}
