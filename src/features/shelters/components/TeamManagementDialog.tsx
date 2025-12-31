import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Divider,
  Chip,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { ShelterResponseDto } from "../types";
import { TeamResponseDto, CreateTeamDto, UpdateTeamDto } from "../../teams/types";
import {
  useTeams,
  useTeamMutations,
  apiGetTeamsByShelter,
  apiCreateTeam,
  apiUpdateTeam,
  apiDeleteTeam,
} from "../../teams";
import { apiLoadLeaderOptions, apiLoadTeacherOptions, apiFetchShelter, apiFetchSheltersSimple } from "../api";
import { LeaderOption, TeacherOption } from "../types";
import { apiManageTeacherTeam } from "../../teachers/api";
import { apiManageLeaderTeam } from "../../leaders/api";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

type Props = {
  open: boolean;
  shelter?: ShelterResponseDto | null;
  shelterId?: string;
  teacherId?: string;
  leaderId?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

type TabValue = "teams" | "leaders" | "teachers";

export default function TeamManagementDialog({
  open,
  shelter: shelterProp,
  shelterId,
  teacherId,
  leaderId,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>("teams");
  const [teams, setTeams] = useState<TeamResponseDto[]>([]);
  const [shelter, setShelter] = useState<ShelterResponseDto | null>(shelterProp || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leaderOptions, setLeaderOptions] = useState<LeaderOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [editingTeam, setEditingTeam] = useState<TeamResponseDto | null>(null);
  const [shelterOptions, setShelterOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(shelterId || null);
  
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [newTeamNumber, setNewTeamNumber] = useState<number>(1);
  const [showAddLeaderDialog, setShowAddLeaderDialog] = useState(false);
  const [selectedTeamForLeader, setSelectedTeamForLeader] = useState<string | null>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [showAddTeacherDialog, setShowAddTeacherDialog] = useState(false);
  const [selectedTeamForTeacher, setSelectedTeamForTeacher] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const loadShelter = async () => {
    const currentShelterId = selectedShelterId || shelterId;
    if (currentShelterId && !shelter) {
      setLoading(true);
      try {
        const data = await apiFetchShelter(currentShelterId);
        setShelter(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Erro ao carregar abrigo");
      } finally {
        setLoading(false);
      }
    }
  };

  const loadTeams = async () => {
    const currentShelterId = shelter?.id || selectedShelterId || shelterId;
    if (!currentShelterId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiGetTeamsByShelter(currentShelterId);
      setTeams(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao carregar equipes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShelter = async (shelterIdToAdd: string) => {
    if (!shelterIdToAdd) return;
    
    setLoading(true);
    setError("");
    try {
      if (teacherId) {
        const currentShelter = shelter || await apiFetchShelter(shelterIdToAdd);
        const teamsCount = currentShelter?.teams?.length || 0;
        const numberTeam = teamsCount > 0 ? currentShelter.teams[0].numberTeam : 1;
        await apiManageTeacherTeam(teacherId, { shelterId: shelterIdToAdd, numberTeam });
      } else if (leaderId) {
        const currentShelter = shelter || await apiFetchShelter(shelterIdToAdd);
        const teamsCount = currentShelter?.teams?.length || 0;
        const numberTeam = teamsCount > 0 ? currentShelter.teams[0].numberTeam : 1;
        await apiManageLeaderTeam(leaderId, { shelterId: shelterIdToAdd, numberTeam });
      }
      setSelectedShelterId(shelterIdToAdd);
      await loadShelter();
      await loadTeams();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao vincular");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [leaders, teachers] = await Promise.all([
        apiLoadLeaderOptions(),
        apiLoadTeacherOptions(),
      ]);
      setLeaderOptions(leaders || []);
      setTeacherOptions(teachers || []);
    } catch (err) {
      console.error("Erro ao carregar opções:", err);
    }
  };

  const loadShelterOptions = async () => {
    try {
      const data = await apiFetchSheltersSimple();
      setShelterOptions(data?.map(s => ({ id: s.id, name: s.name })) || []);
    } catch (err) {
      console.error("Error loading shelters:", err);
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedShelterId(shelterId || null);
      if (shelterId && !shelter) {
        loadShelter().then(() => {
          loadTeams();
          loadOptions();
        });
      } else if (shelter || shelterId) {
        loadTeams();
        loadOptions();
      } else {
        loadShelterOptions();
        loadOptions();
      }
    }
  }, [open, shelter?.id, shelterId]);

  useEffect(() => {
    if (selectedShelterId && selectedShelterId !== shelterId) {
      setShelter(null);
      loadShelter().then(() => {
        loadTeams();
      });
    }
  }, [selectedShelterId]);

  useEffect(() => {
    if (shelterProp) {
      setShelter(shelterProp);
    }
  }, [shelterProp]);

  const handleClose = () => {
    setActiveTab("teams");
    setEditingTeam(null);
    setError("");
    onClose();
  };

  const handleSuccess = async () => {
    await loadTeams();
    if (onSuccess) await onSuccess();
  };

  const handleCreateTeam = () => {
    const currentShelterId = shelter?.id || selectedShelterId || shelterId;
    if (!currentShelterId) {
      setError("Selecione um abrigo primeiro");
      return;
    }
    const maxNumber = teams.length > 0 ? Math.max(...teams.map(t => t.numberTeam || 0)) : 0;
    setNewTeamNumber(maxNumber + 1);
    setShowCreateTeamDialog(true);
  };

  const handleConfirmCreateTeam = async () => {
    if (!newTeamNumber || newTeamNumber < 1) {
      setError("O número da equipe deve ser maior que 0");
      return;
    }

    const currentShelterId = shelter?.id || selectedShelterId || shelterId;
    if (!currentShelterId) {
      setError("Selecione um abrigo primeiro");
      return;
    }

    if (teams.some(t => t.numberTeam === newTeamNumber)) {
      setError("Já existe uma equipe com este número");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiCreateTeam({
        numberTeam: newTeamNumber,
        shelterId: currentShelterId,
        leaderProfileIds: [],
        teacherProfileIds: [],
      });
      setShowCreateTeamDialog(false);
      setNewTeamNumber(1);
      await handleSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao criar equipe");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    setLoading(true);
    setError("");
    try {
      await apiDeleteTeam(teamToDelete);
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
      await handleSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao excluir equipe");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeader = (teamId: string) => {
    const availableLeaders = leaderOptions.filter(
      (l) => !teams.some((t) => t.leaders.some((tl) => tl.id === l.leaderProfileId))
    );

    if (availableLeaders.length === 0) {
      setError("Não há líderes disponíveis para adicionar");
      return;
    }

    setSelectedTeamForLeader(teamId);
    setSelectedLeaderId(null);
    setShowAddLeaderDialog(true);
  };

  const handleConfirmAddLeader = async () => {
    if (!selectedTeamForLeader || !selectedLeaderId) {
      setError("Selecione um líder");
      return;
    }

    const currentShelterId = shelter?.id || selectedShelterId || shelterId;
    if (!currentShelterId) {
      setError("Selecione um abrigo primeiro");
      return;
    }

    const selectedTeam = teams.find((t) => t.id === selectedTeamForLeader);
    if (!selectedTeam) {
      setError("Equipe não encontrada");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiManageLeaderTeam(selectedLeaderId, { 
        shelterId: currentShelterId, 
        numberTeam: selectedTeam.numberTeam 
      });
      setShowAddLeaderDialog(false);
      setSelectedTeamForLeader(null);
      setSelectedLeaderId(null);
      await handleSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao adicionar líder");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLeader = async (teamId: string, leaderId: string) => {
    setError("Para remover um líder, vincule-o a outra equipe ou abrigo usando a opção de editar.");
  };

  const handleAddTeacher = (teamId: string) => {
    const availableTeachers = teacherOptions.filter(
      (t) => !teams.some((team) => team.teachers.some((tt) => tt.id === t.teacherProfileId))
    );

    if (availableTeachers.length === 0) {
      setError("Não há membros disponíveis para adicionar");
      return;
    }

    setSelectedTeamForTeacher(teamId);
    setSelectedTeacherId(null);
    setShowAddTeacherDialog(true);
  };

  const handleConfirmAddTeacher = async () => {
    if (!selectedTeamForTeacher || !selectedTeacherId) {
      setError("Selecione um membro");
      return;
    }

    const currentShelterId = shelter?.id || selectedShelterId || shelterId;
    if (!currentShelterId) {
      setError("Selecione um abrigo primeiro");
      return;
    }

    const selectedTeam = teams.find((t) => t.id === selectedTeamForTeacher);
    if (!selectedTeam) {
      setError("Equipe não encontrada");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiManageTeacherTeam(selectedTeacherId, { 
        shelterId: currentShelterId, 
        numberTeam: selectedTeam.numberTeam 
      });
      setShowAddTeacherDialog(false);
      setSelectedTeamForTeacher(null);
      setSelectedTeacherId(null);
      await handleSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao adicionar membro");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeacher = async (teamId: string, teacherId: string) => {
    setError("Para remover um membro, vincule-o a outra equipe ou abrigo usando a opção de editar.");
  };

  const allLeaders = teams.flatMap((t) => t.leaders);
  const allTeachers = teams.flatMap((t) => t.teachers);

  const currentShelterId = shelter?.id || selectedShelterId || shelterId;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <GroupIcon />
          <Typography variant="h6">
            Gerenciar Equipes {shelter?.name ? `- ${shelter.name}` : ""}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {!currentShelterId && (
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              options={shelterOptions}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={shelterOptions.find(s => s.id === selectedShelterId) || null}
              onChange={(_, newValue) => {
                if (newValue) {
                  handleAddToShelter(newValue.id);
                }
              }}
              loading={loading}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Selecionar Abrigo"
                  placeholder="Escolha um abrigo para gerenciar equipes"
                  helperText={teacherId || leaderId ? "Selecione um abrigo para vincular o membro/líder" : "Selecione um abrigo para gerenciar suas equipes"}
                />
              )}
            />
          </Box>
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Equipes" value="teams" icon={<GroupIcon />} iconPosition="start" />
          <Tab label="Líderes" value="leaders" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Membros" value="teachers" icon={<SchoolIcon />} iconPosition="start" />
        </Tabs>

        {loading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}

        {activeTab === "teams" && (
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>
                Equipes ({teams.length})
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={handleCreateTeam}
                disabled={loading}
              >
                Nova Equipe
              </Button>
            </Box>

            {teams.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Nenhuma equipe cadastrada. Clique em "Nova Equipe" para criar.
                </Typography>
              </Paper>
            ) : (
              teams.map((team) => (
                <Paper key={team.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Equipe {team.numberTeam}
                        </Typography>
                        {team.description && (
                          <Typography variant="body2" color="text.secondary">
                            {team.description}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTeam(team.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Líderes ({team.leaders.length})
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {team.leaders.map((leader) => {
                          const leaderFromOptions = leaderOptions.find(l => l.leaderProfileId === leader.id);
                          const leaderName = leader.user?.name 
                            || leader.user?.email 
                            || leaderFromOptions?.name 
                            || "Sem nome";
                          return (
                            <Chip
                              key={leader.id}
                              label={leaderName}
                              size="small"
                              onDelete={() => handleRemoveLeader(team.id, leader.id)}
                              disabled={loading}
                            />
                          );
                        })}
                        <Chip
                          label="+ Adicionar"
                          size="small"
                          color="primary"
                          variant="outlined"
                          onClick={() => handleAddLeader(team.id)}
                          disabled={loading}
                        />
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Membros ({team.teachers.length})
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {team.teachers.map((teacher) => {
                          const teacherFromOptions = teacherOptions.find(t => t.teacherProfileId === teacher.id);
                          const teacherName = teacher.user?.name 
                            || teacher.user?.email 
                            || teacherFromOptions?.name 
                            || "Sem nome";
                          return (
                            <Chip
                              key={teacher.id}
                              label={teacherName}
                              size="small"
                              onDelete={() => handleRemoveTeacher(team.id, teacher.id)}
                              disabled={loading}
                            />
                          );
                        })}
                        <Chip
                          label="+ Adicionar"
                          size="small"
                          color="primary"
                          variant="outlined"
                          onClick={() => handleAddTeacher(team.id)}
                          disabled={loading}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {activeTab === "leaders" && (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Todos os Líderes ({allLeaders.length})
            </Typography>
            {allLeaders.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">Nenhum líder vinculado às equipes.</Typography>
              </Paper>
            ) : (
              <List>
                {allLeaders.map((leader) => {
                  const team = teams.find((t) => t.leaders.some((l) => l.id === leader.id));
                  const leaderName = leader.user?.name || leader.user?.email || "Sem nome";
                  return (
                    <ListItem key={leader.id}>
                      <ListItemText
                        primary={leaderName}
                        secondary={team ? `Equipe: ${team.numberTeam}` : "Sem equipe"}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Stack>
        )}

        {activeTab === "teachers" && (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Todos os Membros ({allTeachers.length})
            </Typography>
            {allTeachers.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Nenhum membro vinculado às equipes.
                </Typography>
              </Paper>
            ) : (
              <List>
                {allTeachers.map((teacher) => {
                  const team = teams.find((t) => t.teachers.some((tt) => tt.id === teacher.id));
                  const teacherName = teacher.user?.name || teacher.user?.email || "Sem nome";
                  return (
                    <ListItem key={teacher.id}>
                      <ListItemText
                        primary={teacherName}
                        secondary={team ? `Equipe: ${team.numberTeam}` : "Sem equipe"}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>

      <Dialog open={showCreateTeamDialog} onClose={() => setShowCreateTeamDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Nova Equipe</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Número da equipe"
            type="number"
            fullWidth
            variant="outlined"
            value={newTeamNumber}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setNewTeamNumber(val);
            }}
            inputProps={{ min: 1, step: 1 }}
            helperText="Número da equipe (1, 2, 3, 4...)"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleConfirmCreateTeam();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateTeamDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmCreateTeam} variant="contained" disabled={!newTeamNumber || newTeamNumber < 1 || loading}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAddLeaderDialog} onClose={() => setShowAddLeaderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Líder à Equipe</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={leaderOptions.filter(
              (l) => !teams.some((t) => t.leaders.some((tl) => tl.id === l.leaderProfileId))
            )}
            getOptionLabel={(option) => option.name || ""}
            value={leaderOptions.find((l) => l.leaderProfileId === selectedLeaderId) || null}
            onChange={(_, newValue) => setSelectedLeaderId(newValue?.leaderProfileId || null)}
            renderInput={(params) => (
              <TextField {...params} label="Selecione um líder" placeholder="Digite para buscar..." />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddLeaderDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAddLeader} variant="contained" disabled={!selectedLeaderId || loading}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAddTeacherDialog} onClose={() => setShowAddTeacherDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={teacherOptions.filter(
              (t) => !teams.some((team) => team.teachers.some((tt) => tt.id === t.teacherProfileId))
            )}
            getOptionLabel={(option) => option.name || ""}
            value={teacherOptions.find((t) => t.teacherProfileId === selectedTeacherId) || null}
            onChange={(_, newValue) => setSelectedTeacherId(newValue?.teacherProfileId || null)}
            renderInput={(params) => (
              <TextField {...params} label="Selecione um membro" placeholder="Digite para buscar..." />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddTeacherDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAddTeacher} variant="contained" disabled={!selectedTeacherId || loading}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
          <Button onClick={handleConfirmDeleteTeam} variant="contained" color="error" disabled={loading}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

