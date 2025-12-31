import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Typography,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { TeacherProfile } from "../types";
import { fmtDate } from "@/utils/dates";
import TeamManagementDialog from "../../shelters/components/TeamManagementDialog";

type Props = {
  open: boolean;
  teacher: TeacherProfile | null;
  onClose: () => void;
};

export default function TeacherViewDialog({ open, teacher, onClose }: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [teamManagementOpen, setTeamManagementOpen] = React.useState(false);

  const shelterName = teacher?.shelter?.name ?? "—";
  const shelterId = teacher?.shelter?.id;
  const teamNumber = teacher?.shelter?.team?.numberTeam;
  const leaderName = teacher?.shelter?.leader?.user?.name ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalhes do Membro</DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {!!teacher && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {teacher.user.name || teacher.user.email || "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {teacher.user.email || "—"}
              </Typography>
            </Grid>

            {shelterName !== "—" && (
              <>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Abrigo:
                    </Typography>
                    <Chip size="small" color="secondary" label={shelterName} />
                    <Tooltip title="Gerenciar Equipes do Abrigo">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setTeamManagementOpen(true)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Grid>
                {teamNumber !== undefined && (
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Equipe:
                      </Typography>
                      <Chip size="small" color="info" label={`Equipe ${teamNumber}`} />
                    </Stack>
                  </Grid>
                )}
              </>
            )}

            {leaderName && (
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Líder da Equipe:
                  </Typography>
                  <Chip size="small" color="primary" label={leaderName} />
                </Stack>
              </Grid>
            )}

            {isMdUp && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Criado:</strong> {fmtDate(teacher.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Atualizado:</strong> {fmtDate(teacher.updatedAt)}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>

      <TeamManagementDialog
        open={teamManagementOpen}
        shelterId={shelterId}
        teacherId={teacher?.id}
        onClose={() => setTeamManagementOpen(false)}
        onSuccess={async () => {
        }}
      />
    </Dialog>
  );
}
