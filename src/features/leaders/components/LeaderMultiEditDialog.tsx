import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Alert,
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { Close, Add, Delete } from "@mui/icons-material";
import { LeaderProfile, LeaderAssociationUpdateDto } from "../types";
import { apiUpdateLeaderAssociations, apiListSheltersSimple, apiGetTeamsByShelter } from "../api";
import { ShelterSimpleResponse } from "../types";

type ShelterAssociation = {
  shelterId: string;
  shelterName: string;
  teams: number[];
};

type Props = {
  open: boolean;
  leader: LeaderProfile | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function LeaderMultiEditDialog({
  open,
  leader,
  onClose,
  onSuccess,
}: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [shelters, setShelters] = useState<ShelterSimpleResponse[]>([]);
  const [associations, setAssociations] = useState<ShelterAssociation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingShelters, setLoadingShelters] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      loadShelters();
    }
  }, [open]);

  useEffect(() => {
    if (open && leader) {
      loadCurrentAssociations();
    } else if (open) {
      setAssociations([]);
    }
  }, [open, leader]);

  const loadShelters = async () => {
    setLoadingShelters(true);
    setError("");
    try {
      const data = await apiListSheltersSimple();
      setShelters(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao carregar abrigos");
    } finally {
      setLoadingShelters(false);
    }
  };

  const loadCurrentAssociations = () => {
    if (!leader) return;

    const currentAssociations: ShelterAssociation[] = leader.shelters.map(shelter => ({
      shelterId: shelter.id,
      shelterName: shelter.name,
      teams: shelter.teams.map(team => team.numberTeam),
    }));

    setAssociations(currentAssociations);
  };

  const handleAddAssociation = () => {
    setAssociations(prev => [...prev, { shelterId: "", shelterName: "", teams: [] }]);
  };

  const handleRemoveAssociation = (index: number) => {
    setAssociations(prev => prev.filter((_, i) => i !== index));
  };

  const handleShelterChange = async (index: number, shelter: ShelterSimpleResponse | null) => {
    if (!shelter) {
      setAssociations(prev => {
        const newAssociations = [...prev];
        newAssociations[index] = { shelterId: "", shelterName: "", teams: [] };
        return newAssociations;
      });
      return;
    }

    const isAlreadySelected = associations.some((assoc, i) =>
      i !== index && assoc.shelterId === shelter.id
    );

    if (isAlreadySelected) {
      setError("Este abrigo já foi selecionado");
      return;
    }

    setAssociations(prev => {
      const newAssociations = [...prev];
      newAssociations[index] = {
        shelterId: shelter.id,
        shelterName: shelter.name,
        teams: [],
      };
      return newAssociations;
    });
  };

  const handleTeamsChange = (index: number, teamNumbers: number[]) => {
    setAssociations(prev => {
      const newAssociations = [...prev];
      newAssociations[index].teams = teamNumbers;
      return newAssociations;
    });
  };

  const getAvailableShelters = (currentIndex: number) => {
    const selectedShelterIds = associations
      .map((assoc, index) => index !== currentIndex ? assoc.shelterId : null)
      .filter(Boolean);

    return shelters.filter(shelter => !selectedShelterIds.includes(shelter.id));
  };

  const getShelterTeams = async (shelterId: string): Promise<{ id: string; numberTeam: number; description: string | null }[]> => {
    try {
      const teams = await apiGetTeamsByShelter(shelterId);
      return teams.map(team => ({
        id: team.id,
        numberTeam: team.numberTeam,
        description: team.description ?? null,
      }));
    } catch {
      return [];
    }
  };

  const validateAssociations = (): string | null => {
    if (associations.length === 0) {
      return null; 
    }

    for (const assoc of associations) {
      if (!assoc.shelterId) {
        return "Selecione um abrigo para todas as associações";
      }
      if (assoc.teams.length === 0) {
        return `Selecione pelo menos uma equipe para o abrigo ${assoc.shelterName}`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!leader) return;

    setError("");

    const validationError = validateAssociations();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: LeaderAssociationUpdateDto = associations.map(assoc => ({
      shelterId: assoc.shelterId,
      teams: assoc.teams,
    }));

    setLoading(true);
    try {
      await apiUpdateLeaderAssociations(leader.id, payload);
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao atualizar associações");
    } finally {
      setLoading(false);
    }
  };

  const renderAssociationCard = (association: ShelterAssociation, index: number) => {
    const availableShelters = getAvailableShelters(index);
    const selectedShelter = shelters.find(s => s.id === association.shelterId);

    return (
      <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ pb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Associação {index + 1}
            </Typography>
            {associations.length > 1 && (
              <IconButton
                size="small"
                onClick={() => handleRemoveAssociation(index)}
                color="error"
                disabled={loading}
              >
                <Delete />
              </IconButton>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={availableShelters}
                getOptionLabel={(option) => option.name}
                value={selectedShelter || null}
                onChange={(_, newValue) => handleShelterChange(index, newValue)}
                loading={loadingShelters}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Abrigo"
                    placeholder="Selecione um abrigo"
                    required
                    error={!association.shelterId}
                    helperText={!association.shelterId ? "Obrigatório" : ""}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              {selectedShelter ? (
                <TeamsSelector
                  shelterId={selectedShelter.id}
                  selectedTeams={association.teams}
                  onChange={(teams) => handleTeamsChange(index, teams)}
                  disabled={loading}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Equipes"
                  value="Selecione um abrigo primeiro"
                  disabled
                  sx={{ opacity: 0.6 }}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: isXs ? "98vw" : undefined,
          maxWidth: isXs ? "98vw" : undefined,
          m: isXs ? 0 : undefined,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        Editar Associações do Líder
        {leader && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {leader.user.name || leader.user.email || "—"}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {leader && associations.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Associações atuais:
            </Typography>
            <Typography variant="body2">
              Este líder está atualmente associado a {leader.shelters.length} abrigo(s) e {leader.shelters.reduce((total, s) => total + s.teams.length, 0)} equipe(s).
            </Typography>
          </Alert>
        )}

        {associations.map(renderAssociationCard)}

        <Box sx={{ mt: 2, mb: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddAssociation}
            disabled={loading || associations.length >= shelters.length}
            sx={{ borderRadius: 2 }}
          >
            Adicionar Associação
          </Button>
        </Box>

        {associations.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Nenhuma associação selecionada
            </Typography>
            <Typography variant="body2">
              O líder será desvinculado de todos os abrigos. Clique em "Adicionar Associação" para vincular a abrigos/equipes.
            </Typography>
          </Alert>
        )}

        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? "Salvando..." : "Salvar Associações"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TeamsSelector({
  shelterId,
  selectedTeams,
  onChange,
  disabled
}: {
  shelterId: string;
  selectedTeams: number[];
  onChange: (teams: number[]) => void;
  disabled?: boolean;
}) {
  const [teams, setTeams] = useState<{ id: string; numberTeam: number; description: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shelterId) {
      loadTeams();
    } else {
      setTeams([]);
    }
  }, [shelterId]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await apiGetTeamsByShelter(shelterId);
      setTeams(data.map(team => ({
        id: team.id,
        numberTeam: team.numberTeam,
        description: team.description ?? null,
      })));
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamNumber: number) => {
    const newSelected = selectedTeams.includes(teamNumber)
      ? selectedTeams.filter(t => t !== teamNumber)
      : [...selectedTeams, teamNumber];
    onChange(newSelected);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Equipes:
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {loading ? (
          <CircularProgress size={20} />
        ) : teams.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma equipe encontrada
          </Typography>
        ) : (
          teams.map((team) => (
            <Chip
              key={team.id}
              label={`Equipe ${team.numberTeam}`}
              onClick={() => handleTeamToggle(team.numberTeam)}
              color={selectedTeams.includes(team.numberTeam) ? "primary" : "default"}
              variant={selectedTeams.includes(team.numberTeam) ? "filled" : "outlined"}
              size="small"
              disabled={disabled}
              sx={{ borderRadius: 1 }}
            />
          ))
        )}
      </Box>
      {teams.length > 0 && selectedTeams.length === 0 && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          Selecione pelo menos uma equipe
        </Typography>
      )}
    </Box>
  );
}
