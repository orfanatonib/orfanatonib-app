import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Chip,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { LeaderProfile } from "../types";
import CircularProgress from "@mui/material/CircularProgress";
import { fmtDate } from "@/utils/dates";
import TeamManagementDialog from "../../shelters/components/TeamManagementDialog";

type Props = {
  open: boolean;
  loading?: boolean;
  leader: LeaderProfile | null;
  onClose: () => void;
};

export default function LeaderViewDialog({ open, loading, leader, onClose }: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [teamManagementOpen, setTeamManagementOpen] = React.useState(false);

  // Professores agora são acessados via shelter
  const teachers = React.useMemo(() => {
    return leader?.shelter?.teachers || [];
  }, [leader]);

  const shelterId = leader?.shelter?.id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalhes do Líder</DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {loading && <Box textAlign="center" my={2}><CircularProgress size={24} /></Box>}
        {!!leader && (
          <Grid container spacing={2}>
            <Grid item xs={12}><strong>Nome:</strong> {leader.user.name ?? "—"}</Grid>
            <Grid item xs={12}><strong>Email:</strong> {leader.user.email ?? "—"}</Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <strong>Equipe</strong>
                <Tooltip title="Gerenciar Equipes do Abrigo">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setTeamManagementOpen(true)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            {leader.shelter && (
              <>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Abrigo:
                    </Typography>
                    <Chip size="small" color="secondary" label={leader.shelter.name} />
                  </Stack>
                </Grid>
                {leader.shelter.team?.numberTeam !== undefined && (
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Equipe:
                      </Typography>
                      <Chip size="small" color="info" label={`Equipe ${leader.shelter.team.numberTeam}`} />
                    </Stack>
                  </Grid>
                )}
              </>
            )}

            <Grid item xs={12}><strong>Professores</strong></Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {teachers.length === 0 ? (
                  <Chip label="—" />
                ) : (
                  teachers.map((t) => {
                    const teacherName = t.user?.name || t.user?.email || "Sem nome";
                    return <Chip key={t.id} label={teacherName} />;
                  })
                )}
              </Box>
            </Grid>

            {isMdUp && (
              <>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={12} md={6}><strong>Criado:</strong> {fmtDate(leader.createdAt)}</Grid>
                <Grid item xs={12} md={6}><strong>Atualizado:</strong> {fmtDate(leader.updatedAt)}</Grid>
              </>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Fechar</Button></DialogActions>

      <TeamManagementDialog
        open={teamManagementOpen}
        shelterId={shelterId}
        leaderId={leader?.id}
        onClose={() => setTeamManagementOpen(false)}
        onSuccess={async () => {
          // Não fechar o modal, apenas atualizar os dados se necessário
          // O modal só fecha quando o usuário clicar em "Fechar"
        }}
      />
    </Dialog>
  );
}
