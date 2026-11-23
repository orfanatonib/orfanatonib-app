import { useEffect, useState } from "react";
import { Avatar, Box, Collapse, Typography } from "@mui/material";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ExpandMore from "@mui/icons-material/ExpandMore";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import type { AttendanceTeamSelectionProps } from "../workspace.types";
import { ATTENDANCE_LIST_PREFIX, ATTENDANCE_TOUCH_SIZE } from "../constants";
import { attendanceColors } from "@/theme/attendance";
import { AdminCardGrid, AdminChipRow, AdminEntityCard } from "@/components/common/admin-shell";

/** Abrigos da página (cartão `AdminEntityCard`); o botão do cartão abre as equipes para lançar. */
export default function TeamSelection({ data, onTeamSelect }: AttendanceTeamSelectionProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    // Um único abrigo (ou busca que o isolou) já chega aberto: menos um toque.
    if (data.length === 1) setOpen(new Set([data[0].shelterId]));
  }, [data]);
  const toggle = (shelterId: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(shelterId)) next.add(shelterId);
      return next;
    });

  return (
    <AdminCardGrid testId={`${ATTENDANCE_LIST_PREFIX}-cards`}>
      {data.map((shelter) => {
        const isOpen = open.has(shelter.shelterId);
        const members = shelter.teams.reduce((total, team) => total + team.members.length, 0);
        return (
          <AdminEntityCard
            key={shelter.shelterId}
            testId={`${ATTENDANCE_LIST_PREFIX}-card-${shelter.shelterId}`}
            title={shelter.shelterName}
            titleTestId={`${ATTENDANCE_LIST_PREFIX}-card-title-${shelter.shelterId}`}
            avatar={
              <Avatar sx={{ bgcolor: attendanceColors.accent, width: 44, height: 44 }}>
                {shelter.shelterName.charAt(0).toUpperCase()}
              </Avatar>
            }
            meta={
              <Box>
                <AdminChipRow
                  testId={`${ATTENDANCE_LIST_PREFIX}-card-chips-${shelter.shelterId}`}
                  chips={[
                    { key: "teams", label: `${shelter.teams.length} equipe(s)`, testId: `${ATTENDANCE_LIST_PREFIX}-card-teams-${shelter.shelterId}`, color: "primary", icon: <GroupsOutlined /> },
                    { key: "members", label: `${members} membro(s)`, testId: `${ATTENDANCE_LIST_PREFIX}-card-members-${shelter.shelterId}` },
                  ]}
                />
                <Collapse in={isOpen} unmountOnExit>
                  <Box sx={{ display: "grid", gap: 1.25, mt: 1.5 }}>
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
                          minHeight: ATTENDANCE_TOUCH_SIZE + 20,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          cursor: "pointer",
                          border: "1px solid",
                          borderColor: attendanceColors.border,
                          borderRadius: 2,
                          "&:hover": { bgcolor: attendanceColors.soft, borderColor: attendanceColors.accent },
                          "&:focus-visible": { outline: `3px solid ${attendanceColors.accent}` },
                        }}
                      >
                        <Avatar variant="rounded" sx={{ bgcolor: attendanceColors.soft, color: attendanceColors.accent, fontWeight: 800 }}>
                          {team.teamNumber}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={800} sx={{ color: attendanceColors.ink }}>
                            Equipe {team.teamNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                            {team.description || "Sem descrição"} · {team.members.length} membro(s)
                          </Typography>
                        </Box>
                        <Typography
                          component="span"
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: attendanceColors.accent, display: "inline-flex", alignItems: "center", gap: 0.5 }}
                        >
                          Lançar <ArrowForward fontSize="small" />
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            }
            actions={[
              {
                key: "toggle",
                label: isOpen ? "Ocultar equipes" : "Ver equipes",
                ariaLabel: `${isOpen ? "Ocultar" : "Ver"} equipes de ${shelter.shelterName}`,
                testId: `attendance-shelter-toggle-${shelter.shelterId}`,
                variant: "outlined",
                icon: <ExpandMore sx={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />,
                onClick: () => toggle(shelter.shelterId),
              },
            ]}
          />
        );
      })}
    </AdminCardGrid>
  );
}
