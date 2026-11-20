import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ArrowForward from "@mui/icons-material/ArrowForward";
import type { AttendanceTeamSelectionProps } from "../workspace.types";
import { attendanceCardSx, attendanceColors } from "@/theme/attendance";

export default function TeamSelection({
  data,
  loading,
  onTeamSelect,
  searchTerm,
}: AttendanceTeamSelectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    if (data.length === 1) setExpanded(data[0].shelterId);
  }, [data, searchTerm]);
  if (loading)
    return (
      <Skeleton
        data-testid="attendance-loading"
        variant="rounded"
        height={160}
      />
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
    <Stack data-testid="attendance-shelters" spacing={1.5}>
      {data.map((shelter) => (
        <Accordion
          key={shelter.shelterId}
          expanded={expanded === shelter.shelterId}
          onChange={(_, value) => setExpanded(value ? shelter.shelterId : null)}
          disableGutters
          elevation={0}
          sx={{ ...attendanceCardSx, p: 0, "&:before": { display: "none" } }}
        >
          <AccordionSummary
            data-testid={`attendance-shelter-toggle-${shelter.shelterId}`}
            expandIcon={<ExpandMore />}
            sx={{ minHeight: 72 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                fontWeight={800}
                sx={{ color: attendanceColors.ink, overflowWrap: "anywhere" }}
              >
                {shelter.shelterName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {shelter.teams.length} equipe(s) · Selecione para lançar
                presença
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              {shelter.teams.map((team) => (
                <Button
                  data-testid={`attendance-team-${team.teamId}`}
                  key={team.teamId}
                  onClick={() => onTeamSelect(shelter, team)}
                  sx={{
                    p: 2,
                    minHeight: 84,
                    border: "1px solid",
                    borderColor: attendanceColors.border,
                    borderRadius: 2,
                    color: attendanceColors.ink,
                    textAlign: "left",
                    justifyContent: "space-between",
                    gap: 1,
                    "&:hover": { bgcolor: attendanceColors.soft },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800}>
                      Equipe {team.teamNumber}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {team.description}
                    </Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${team.members.length} membro(s)`}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <ArrowForward fontSize="small" />
                </Button>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}
