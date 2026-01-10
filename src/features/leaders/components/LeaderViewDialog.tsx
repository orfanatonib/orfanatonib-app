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

type Props = {
  open: boolean;
  loading?: boolean;
  leader: LeaderProfile | null;
  onClose: () => void;
};

export default function LeaderViewDialog({ open, loading, leader, onClose }: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const shelters = React.useMemo(() => {
    return leader?.shelters || [];
  }, [leader]);

  const totalShelters = shelters.length;
  const totalTeams = shelters.reduce((total, shelter) => total + shelter.teams.length, 0);
  const allTeachers = shelters.flatMap(shelter => shelter.teachers || []);
  const totalTeachers = allTeachers.length;

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
                <strong>Associações</strong>
                <Typography variant="caption" color="text.secondary">
                  (Use o botão editar na tabela principal)
                </Typography>
              </Box>
            </Grid>

            {totalShelters > 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {totalShelters} abrigo{totalShelters > 1 ? 's' : ''}, {totalTeams} equipe{totalTeams > 1 ? 's' : ''}
                </Typography>
                <Stack spacing={2}>
                  {shelters.map((shelter) => (
                    <Box
                      key={shelter.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.default'
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Abrigo:
                          </Typography>
                          <Chip size="small" color="secondary" label={shelter.name} />
                        </Stack>

                        {shelter.teams.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              Equipes:
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              {shelter.teams.map((team) => (
                                <Chip
                                  key={team.id}
                                  size="small"
                                  color="info"
                                  label={`Equipe ${team.numberTeam}`}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {shelter.teachers && shelter.teachers.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              Membros:
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              {shelter.teachers.map((t) => {
                                const teacherName = t.user?.name || t.user?.email || "Sem nome";
                                return (
                                  <Chip key={t.id} size="small" color="success" label={teacherName} />
                                );
                              })}
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Não vinculado a nenhum abrigo
                </Typography>
              </Grid>
            )}

            {totalTeachers > 0 && (
              <>
                <Grid item xs={12}><strong>Todos os Membros</strong></Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {allTeachers.map((t) => {
                      const teacherName = t.user?.name || t.user?.email || "Sem nome";
                      return <Chip key={t.id} label={teacherName} />;
                    })}
                  </Box>
                </Grid>
              </>
            )}

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

    </Dialog>
  );
}
