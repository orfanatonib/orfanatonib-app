import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import ChipsListWithExpand from "./ChipsListWithExpand";
import { apiListLeadersSimple } from "@/features/leaders/api";
import { apiListMembersSimple } from "@/features/members/api";
import { apiFetchShelter } from "../api";
import { ShelterResponseDto } from "../types";
import { LeaderSimpleListDto } from "@/features/leaders/types";
import { MemberSimpleListDto } from "@/features/members/types";

type Props = {
  shelterId: string | null;
  teamsQuantity: number;
  onTeamsQuantityChange?: (newQuantity: number) => void;
};

export type TeamManagementRef = {
  getCurrentTeams: () => any[];
};

const TeamManagementSection = forwardRef<TeamManagementRef, Props>(
  ({ shelterId, teamsQuantity, onTeamsQuantityChange }, ref) => {
    const [shelter, setShelter] = useState<ShelterResponseDto | null>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [leaderOptions, setLeaderOptions] = useState<LeaderSimpleListDto[]>([]);
    const [memberOptions, setMemberOptions] = useState<MemberSimpleListDto[]>([]);
    
    const [showAddLeaderDialog, setShowAddLeaderDialog] = useState(false);
    const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
    const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<number | null>(null);
    const [selectedTeamNumber, setSelectedTeamNumber] = useState<number | null>(null);
    const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
    const [memberSearchTerm, setMemberSearchTerm] = useState("");

    useImperativeHandle(ref, () => ({
      getCurrentTeams: () => teams,
    }));

    const loadShelter = useCallback(async () => {
      if (!shelterId) return;
      
      setLoading(true);
      try {
        const data = await apiFetchShelter(shelterId);
        setShelter(data);
        
        const existingTeams = data.teams || [];
        const teamsMap = new Map(existingTeams.map(t => [t.numberTeam, t]));
        const allTeams = [];
        
        for (let i = 1; i <= teamsQuantity; i++) {
          if (teamsMap.has(i)) {
            allTeams.push(teamsMap.get(i)!);
          } else {
            allTeams.push({
              numberTeam: i,
              leaders: [],
              members: [],
            });
          }
        }
        
        setTeams(allTeams);
      } catch (err: any) {
        console.error("Error loading shelter:", err);
        setError(err?.response?.data?.message || "Error loading shelter");
      } finally {
        setLoading(false);
      }
    }, [shelterId, teamsQuantity]);

    const loadOptions = useCallback(async () => {
      try {
        const [leaders, members] = await Promise.all([
          apiListLeadersSimple(),
          apiListMembersSimple(),
        ]);
        setLeaderOptions(leaders || []);
        setMemberOptions(members || []);
      } catch (err: any) {
        console.error("Error loading options:", err);
      }
    }, []);

    useEffect(() => {
      if (shelterId) {
        loadShelter();
      } else {
        const initialTeams = [];
        for (let i = 1; i <= teamsQuantity; i++) {
          initialTeams.push({
            numberTeam: i,
            leaders: [],
            members: [],
          });
        }
        setTeams(initialTeams);
      }
      loadOptions();
    }, [shelterId, loadShelter, loadOptions]);

    useEffect(() => {
      if (!shelterId) {
        const allTeams = [];
        for (let i = 1; i <= teamsQuantity; i++) {
          allTeams.push({
            numberTeam: i,
            leaders: [],
            members: [],
          });
        }
        setTeams(allTeams);
        return;
      }

      if (shelterId && !loading) {
        setTeams(prevTeams => {
          if (prevTeams.length === 0) {
            return prevTeams;
          }
          
          const teamsMap = new Map(prevTeams.map(t => [t.numberTeam, t]));
          const allTeams = [];
          
          for (let i = 1; i <= teamsQuantity; i++) {
            if (teamsMap.has(i)) {
              allTeams.push(teamsMap.get(i)!);
            } else {
              allTeams.push({
                numberTeam: i,
                leaders: [],
                members: [],
              });
            }
          }
          
          return allTeams;
        });
      }
    }, [teamsQuantity, shelterId, loading]);

    const handleAddLeader = (teamNumber: number) => {
      setSelectedTeamNumber(teamNumber);
      setSelectedLeaderIds([]);
      setShowAddLeaderDialog(true);
    };

    const handleConfirmAddLeader = () => {
      if (!selectedTeamNumber || selectedLeaderIds.length === 0) {
        setError("Selecione pelo menos um líder");
        return;
      }

      setError("");
      
      const selectedLeaders = leaderOptions.filter(leader => 
        selectedLeaderIds.includes(leader.leaderProfileId)
      );

      setTeams(prevTeams => {
        return prevTeams.map(team => {
          if (team.numberTeam === selectedTeamNumber) {
            const existingLeaderIds = (team.leaders || []).map((l: any) => l.id);
            const newLeaders = selectedLeaders
              .filter(leader => !existingLeaderIds.includes(leader.leaderProfileId))
              .map(leader => ({
                id: leader.leaderProfileId,
                active: true,
                user: {
                  id: leader.leaderProfileId, 
                  name: leader.user.name,
                  email: "",
                  phone: "",
                  active: true,
                  completed: false,
                  commonUser: false,
                },
              }));
            
            return {
              ...team,
              leaders: [...(team.leaders || []), ...newLeaders],
            };
          }
          return team;
        });
      });

      setShowAddLeaderDialog(false);
      setSelectedTeamNumber(null);
      setSelectedLeaderIds([]);
      setLeaderSearchTerm("");
    };

    const handleRemoveLeader = (teamNumber: number, leaderId: string) => {
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.numberTeam === teamNumber
            ? { ...team, leaders: (team.leaders || []).filter((l: any) => l.id !== leaderId) }
            : team
        )
      );
    };

    const handleAddMember = (teamNumber: number) => {
      setSelectedTeamNumber(teamNumber);
      setSelectedMemberIds([]);
      setShowAddMemberDialog(true);
    };

    const handleConfirmAddMember = () => {
      if (!selectedTeamNumber || selectedMemberIds.length === 0) {
        setError("Selecione pelo menos um membro");
        return;
      }

      setError("");
      
      const selectedMembers = memberOptions.filter(member => 
        selectedMemberIds.includes(member.memberProfileId)
      );

      setTeams(prevTeams => {
        const teamsWithoutSelectedMembers = prevTeams.map(team => ({
          ...team,
          members: (team.members || []).filter((t: any) => 
            !selectedMemberIds.includes(t.id)
          ),
        }));

        return teamsWithoutSelectedMembers.map(team => {
          if (team.numberTeam === selectedTeamNumber) {
            const existingMemberIds = (team.members || []).map((t: any) => t.id);
            const newMembers = selectedMembers
              .filter(member => !existingMemberIds.includes(member.memberProfileId))
              .map(member => ({
                id: member.memberProfileId,
                active: true,
                user: {
                  id: member.memberProfileId, 
                  name: member.name,
                  email: "",
                  phone: "",
                  active: true,
                  completed: false,
                  commonUser: false,
                },
              }));
            
            return {
              ...team,
              members: [...(team.members || []), ...newMembers],
            };
          }
          return team;
        });
      });

      setShowAddMemberDialog(false);
      setSelectedTeamNumber(null);
      setSelectedMemberIds([]);
      setMemberSearchTerm("");
    };

    const handleRemoveMember = (teamNumber: number, memberId: string) => {
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.numberTeam === teamNumber
            ? { ...team, members: (team.members || []).filter((t: any) => t.id !== memberId) }
            : team
        )
      );
    };

    const handleDeleteTeamClick = (teamNumber: number) => {
      if (teamsQuantity <= 1) {
        setError("Não é possível excluir a última equipe. O abrigo deve ter pelo menos uma equipe.");
        return;
      }
      setTeamToDelete(teamNumber);
      setShowDeleteTeamDialog(true);
    };

    const handleConfirmDeleteTeam = () => {
      if (!teamToDelete) return;

      const teamNumberToDelete = teamToDelete;

      setTeams(prevTeams => {
        const filteredTeams = prevTeams.filter(team => team.numberTeam !== teamNumberToDelete);
        
        const renumberedTeams = filteredTeams.map(team => {
          if (team.numberTeam > teamNumberToDelete) {
            return {
              ...team,
              numberTeam: team.numberTeam - 1,
            };
          }
          return team;
        });

        renumberedTeams.sort((a, b) => a.numberTeam - b.numberTeam);
        return renumberedTeams;
      });

      const newQuantity = teamsQuantity - 1;
      if (onTeamsQuantityChange) {
        onTeamsQuantityChange(newQuantity);
      }

      setShowDeleteTeamDialog(false);
      setTeamToDelete(null);
    };

    const getAvailableLeaders = useCallback((teamNumber: number) => {
      return leaderOptions;
    }, [leaderOptions]);

    const getAvailableMembers = useCallback((teamNumber: number) => {
      const team = teams.find((t: any) => t.numberTeam === teamNumber);
      const teamMemberIds = team?.members?.map((t: any) => t.id) || [];
      const membersInOtherTeams = new Set<string>();
      
      teams.forEach((t: any) => {
        if (t.numberTeam !== teamNumber && t.members) {
          t.members.forEach((member: any) => {
            membersInOtherTeams.add(member.id);
          });
        }
      });
      
      return memberOptions.filter((t) => {
        if (membersInOtherTeams.has(t.memberProfileId)) {
          return false;
        }
        return !t.vinculado || teamMemberIds.includes(t.memberProfileId);
      });
    }, [teams, memberOptions]);

    if (teamsQuantity < 1) {
      return null;
    }

    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <GroupIcon color="primary" />
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            Gerenciamento de Equipes ({teamsQuantity})
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {Array.from({ length: teamsQuantity }, (_, i) => {
            const teamNumber = i + 1;
            const team = teams.find((t) => t.numberTeam === teamNumber);
            const teamLeaders = team?.leaders || [];
            const teamMembers = team?.members || [];

            return (
              <Grid item xs={12} sm={6} md={6} lg={4} key={teamNumber}>
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    height: "100%",
                    border: "2px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      elevation: 4,
                      borderColor: "primary.main",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      transform: "translateY(-2px)",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: (t) => {
                        const opacity = teamNumber === 1 ? "FF" : teamNumber === 2 ? "CC" : teamNumber === 3 ? "99" : "66";
                        return `linear-gradient(90deg, ${t.palette.primary.main}${opacity}, ${t.palette.secondary.main}${opacity})`;
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: { xs: 1, sm: 1.5 },
                      mb: { xs: 1.5, sm: 2 },
                      pb: { xs: 1, sm: 1.5 },
                      borderBottom: "2px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: { xs: 32, sm: 36, md: 40 },
                          height: { xs: 32, sm: 36, md: 40 },
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                          flexShrink: 0,
                        }}
                      >
                        {teamNumber}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                          fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Equipe {teamNumber}
                      </Typography>
                    </Box>
                    {teamsQuantity > 1 && (
                      <Tooltip title="Excluir equipe">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTeamClick(teamNumber)}
                          sx={{
                            "&:hover": {
                              bgcolor: "error.light",
                              color: "error.contrastText",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Box
                    sx={{
                      mb: { xs: 1.5, sm: 2, md: 2.5 },
                      p: { xs: 1, sm: 1.25, md: 1.5 },
                      borderRadius: 2,
                      bgcolor: "rgba(255, 255, 0, 0.08)",
                      border: "1px solid",
                      borderColor: "primary.light",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: { xs: 1, sm: 1.5 },
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          color: "primary.dark",
                          fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" },
                          minWidth: 0,
                          flexShrink: 1,
                        }}
                      >
                        <PersonIcon fontSize="small" color="primary" sx={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Líderes ({teamLeaders.length})
                        </span>
                      </Typography>
                      <Tooltip title="Adicionar líder">
                        <IconButton
                          size="small"
                          onClick={() => handleAddLeader(teamNumber)}
                          disabled={loading}
                          sx={{
                            color: "primary.main",
                            '&:hover': {
                              bgcolor: "primary.light",
                              color: "primary.dark",
                            },
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <ChipsListWithExpand
                      items={teamLeaders.map((leader: any) => ({
                        id: leader.id,
                        label: leader.user?.name || leader.user?.email || "Sem nome",
                        color: "primary" as const,
                        variant: "outlined" as const,
                        onDelete: () => handleRemoveLeader(teamNumber, leader.id),
                      }))}
                      maxVisible={5}
                      emptyMessage="Nenhum líder"
                    />
                  </Box>

                  <Box
                    sx={{
                      p: { xs: 1, sm: 1.25, md: 1.5 },
                      borderRadius: 2,
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                      border: "1px solid",
                      borderColor: "grey.300",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: { xs: 1, sm: 1.5 },
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          color: "text.primary",
                          fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" },
                          minWidth: 0,
                          flexShrink: 1,
                        }}
                      >
                        <SchoolIcon fontSize="small" color="secondary" sx={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Membros ({teamMembers.length})
                        </span>
                      </Typography>
                      <Tooltip title="Adicionar membro">
                        <IconButton
                          size="small"
                          onClick={() => handleAddMember(teamNumber)}
                          disabled={loading}
                          sx={{
                            color: "secondary.main",
                            '&:hover': {
                              bgcolor: "secondary.light",
                              color: "secondary.dark",
                            },
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <ChipsListWithExpand
                      items={teamMembers.map((member: any) => ({
                        id: member.id,
                        label: member.user?.name || member.user?.email || "Sem nome",
                        color: "secondary" as const,
                        variant: "outlined" as const,
                        onDelete: () => handleRemoveMember(teamNumber, member.id),
                      }))}
                      maxVisible={5}
                      emptyMessage="Nenhum membro"
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Dialog 
          open={showAddLeaderDialog} 
          onClose={() => {
            setShowAddLeaderDialog(false);
            setSelectedLeaderIds([]);
            setLeaderSearchTerm("");
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              width: { xs: "calc(100% - 16px)", sm: "auto" },
              maxHeight: { xs: "90vh", sm: "80vh" }
            }
          }}
        >
          <DialogTitle sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            Adicionar Líderes à Equipe {selectedTeamNumber}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <TextField
                fullWidth
                placeholder="Buscar líderes..."
                value={leaderSearchTerm}
                onChange={(e) => setLeaderSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {selectedLeaderIds.length} líder(es) selecionado(s)
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
              <List dense>
                {selectedTeamNumber && getAvailableLeaders(selectedTeamNumber)
                  .filter((leader) =>
                    leader.user.name.toLowerCase().includes(leaderSearchTerm.toLowerCase())
                  )
                  .map((leader) => {
                    const isSelected = selectedLeaderIds.includes(leader.leaderProfileId);
                    return (
                      <ListItem key={leader.leaderProfileId} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLeaderIds(selectedLeaderIds.filter((id) => id !== leader.leaderProfileId));
                            } else {
                              setSelectedLeaderIds([...selectedLeaderIds, leader.leaderProfileId]);
                            }
                          }}
                          dense
                        >
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                          />
                          <ListItemText primary={leader.user.name} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                {selectedTeamNumber && getAvailableLeaders(selectedTeamNumber).filter((leader) =>
                  leader.user.name.toLowerCase().includes(leaderSearchTerm.toLowerCase())
                ).length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="Nenhum líder encontrado" 
                      primaryTypographyProps={{ color: "text.secondary", align: "center" }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
            <Button 
              onClick={() => {
                setShowAddLeaderDialog(false);
                setSelectedLeaderIds([]);
                setLeaderSearchTerm("");
              }} 
              sx={{ minWidth: { xs: "auto", sm: 100 } }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAddLeader}
              variant="contained"
              disabled={selectedLeaderIds.length === 0 || loading}
              sx={{ minWidth: { xs: "auto", sm: 100 } }}
            >
              {loading ? <CircularProgress size={20} /> : `Adicionar ${selectedLeaderIds.length > 0 ? `(${selectedLeaderIds.length})` : ""}`}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showAddMemberDialog} 
          onClose={() => {
            setShowAddMemberDialog(false);
            setSelectedMemberIds([]);
            setMemberSearchTerm("");
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              width: { xs: "calc(100% - 16px)", sm: "auto" },
              maxHeight: { xs: "90vh", sm: "80vh" }
            }
          }}
        >
          <DialogTitle sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            Adicionar Membros à Equipe {selectedTeamNumber}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
              <TextField
                fullWidth
                placeholder="Buscar membros..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {selectedMemberIds.length} membro(es) selecionado(s)
              </Typography>
              {selectedTeamNumber && getAvailableMembers(selectedTeamNumber).length === 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Todos os membros disponíveis já estão em outras equipes
                </Alert>
              )}
            </Box>
            <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
              <List dense>
                {selectedTeamNumber && getAvailableMembers(selectedTeamNumber)
                  .filter((member) =>
                    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase())
                  )
                  .map((member) => {
                    const isSelected = selectedMemberIds.includes(member.memberProfileId);
                    return (
                      <ListItem key={member.memberProfileId} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member.memberProfileId));
                            } else {
                              setSelectedMemberIds([...selectedMemberIds, member.memberProfileId]);
                            }
                          }}
                          dense
                        >
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                          />
                          <ListItemText primary={member.name} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                {selectedTeamNumber && getAvailableMembers(selectedTeamNumber).filter((member) =>
                  member.name.toLowerCase().includes(memberSearchTerm.toLowerCase())
                ).length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary={
                        getAvailableMembers(selectedTeamNumber).length === 0
                          ? "Nenhum membro disponível (todos já estão em outras equipes)"
                          : "Nenhum membro encontrado"
                      }
                      primaryTypographyProps={{ color: "text.secondary", align: "center" }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
            <Button 
              onClick={() => {
                setShowAddMemberDialog(false);
                setSelectedMemberIds([]);
                setMemberSearchTerm("");
              }} 
              sx={{ minWidth: { xs: "auto", sm: 100 } }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAddMember}
              variant="contained"
              disabled={selectedMemberIds.length === 0 || loading}
              sx={{ minWidth: { xs: "auto", sm: 100 } }}
            >
              {loading ? <CircularProgress size={20} /> : `Adicionar ${selectedMemberIds.length > 0 ? `(${selectedMemberIds.length})` : ""}`}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showDeleteTeamDialog} 
          onClose={() => {
            setShowDeleteTeamDialog(false);
            setTeamToDelete(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            Excluir Equipe {teamToDelete}?
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Tem certeza que deseja excluir a <strong>Equipe {teamToDelete}</strong>?
            </Typography>
            {teamToDelete && (() => {
              const teamData = teams.find(t => t.numberTeam === teamToDelete);
              const leadersCount = teamData?.leaders?.length || 0;
              const membersCount = teamData?.members?.length || 0;
              
              if (leadersCount > 0 || membersCount > 0) {
                return (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Esta ação irá excluir:
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                      {leadersCount > 0 && <li>{leadersCount} líder(es)</li>}
                      {membersCount > 0 && <li>{membersCount} membro(es)</li>}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      Todos os membros serão removidos junto com a equipe.
                    </Typography>
                  </Alert>
                );
              }
              return null;
            })()}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              As equipes subsequentes serão renumeradas automaticamente.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
            <Button 
              onClick={() => {
                setShowDeleteTeamDialog(false);
                setTeamToDelete(null);
              }} 
              sx={{ minWidth: { xs: "auto", sm: 100 } }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDeleteTeam}
              color="error"
              variant="contained"
              sx={{ minWidth: { xs: "auto", sm: 100 } }}
            >
              Excluir Equipe
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);

TeamManagementSection.displayName = "TeamManagementSection";

export default TeamManagementSection;
