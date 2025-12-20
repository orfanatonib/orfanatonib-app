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
  TextField,
  Autocomplete,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LeaderProfile } from "../types";
import { apiManageLeaderTeam } from "../api";
import { apiFetchSheltersSimple, apiGetShelterTeamsQuantity } from "../../shelters/api";
import { ShelterSimple } from "../../shelters/types";

type Props = {
  open: boolean;
  leader: LeaderProfile | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function LeaderEditDialog({
  open,
  leader,
  onClose,
  onSuccess,
}: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [shelters, setShelters] = useState<ShelterSimple[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<ShelterSimple | null>(null);
  const [numberTeam, setNumberTeam] = useState<number>(1);
  const [teamsQuantity, setTeamsQuantity] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingShelters, setLoadingShelters] = useState(false);
  const [loadingTeamsQuantity, setLoadingTeamsQuantity] = useState(false);
  const [error, setError] = useState("");

  // Carregar abrigos ao abrir o modal
  useEffect(() => {
    if (open) {
      loadShelters();
    }
  }, [open]);

  // Carregar abrigo atual e quantidade de equipes
  useEffect(() => {
    if (open && leader?.shelter) {
      const currentShelter = shelters.find((s) => s.id === leader.shelter?.id);
      if (currentShelter) {
        setSelectedShelter(currentShelter);
        loadTeamsQuantity(currentShelter.id);
      }
    } else if (open) {
      setSelectedShelter(null);
      setTeamsQuantity(null);
      setNumberTeam(1);
    }
  }, [open, leader, shelters]);

  const loadShelters = async () => {
    setLoadingShelters(true);
    setError("");
    try {
      const data = await apiFetchSheltersSimple();
      setShelters(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao carregar abrigos");
    } finally {
      setLoadingShelters(false);
    }
  };

  const loadTeamsQuantity = async (shelterId: string) => {
    setLoadingTeamsQuantity(true);
    setError("");
    try {
      const data = await apiGetShelterTeamsQuantity(shelterId);
      // Se teamsQuantity for 0 ou null, bloquear a inserção
      if (data.teamsQuantity === 0 || data.teamsQuantity === null || data.teamsQuantity === undefined) {
        setTeamsQuantity(null);
      } else {
        setTeamsQuantity(data.teamsQuantity);
        // Se o líder já está vinculado, usar o número da equipe atual
        if (leader?.shelter?.id === shelterId && leader?.shelter?.team?.numberTeam) {
          setNumberTeam(leader.shelter.team.numberTeam);
        } else {
          setNumberTeam(1);
        }
      }
    } catch (err: any) {
      // Se não encontrar a quantidade de equipes, bloquear a inserção
      setTeamsQuantity(null);
      // Não definir erro aqui, apenas deixar teamsQuantity como null para mostrar o alerta de baixo
    } finally {
      setLoadingTeamsQuantity(false);
    }
  };

  const handleShelterChange = (shelter: ShelterSimple | null) => {
    setSelectedShelter(shelter);
    setNumberTeam(1);
    if (shelter) {
      loadTeamsQuantity(shelter.id);
    } else {
      setTeamsQuantity(null);
    }
  };

  const handleSubmit = async () => {
    if (!leader) return;

    setError("");
    
    if (!selectedShelter) {
      setError("Selecione um abrigo");
      return;
    }

    if (!numberTeam || numberTeam < 1) {
      setError("O número da equipe deve ser maior que 0");
      return;
    }

    if (!teamsQuantity || teamsQuantity < 1) {
      setError("Este abrigo não possui quantidade de equipes definida. Por favor, vá na aba de Abrigos, edite este abrigo e defina a quantidade de equipes antes de vincular líderes.");
      return;
    }

    if (numberTeam > teamsQuantity) {
      setError(`O número da equipe não pode ser maior que ${teamsQuantity}`);
      return;
    }

    setLoading(true);
    try {
      await apiManageLeaderTeam(leader.id, {
        shelterId: selectedShelter.id,
        numberTeam,
      });
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao vincular líder");
    } finally {
      setLoading(false);
    }
  };

  // Gerar opções de número de equipe baseado em teamsQuantity
  const teamNumberOptions = teamsQuantity
    ? Array.from({ length: teamsQuantity }, (_, i) => i + 1)
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          width: isXs ? "98vw" : undefined,
          maxWidth: isXs ? "98vw" : undefined,
          m: isXs ? 0 : undefined,
        },
      }}
    >
      <DialogTitle>Vincular Líder a Equipe</DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {leader && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {leader.user.name || leader.user.email || "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {leader.user.email || "—"}
              </Typography>
              {leader.shelter && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Abrigo atual: <strong>{leader.shelter.name}</strong>
                  </Typography>
                  {leader.shelter.team?.numberTeam && (
                    <Typography variant="body2" color="text.secondary">
                      Equipe atual: <strong>Equipe {leader.shelter.team.numberTeam}</strong>
                    </Typography>
                  )}
                  {leader.shelter.teachers && leader.shelter.teachers.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Professores da equipe: <strong>{leader.shelter.teachers.length}</strong>
                    </Typography>
                  )}
                </>
              )}
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={shelters}
                getOptionLabel={(option) => option.name}
                value={selectedShelter}
                onChange={(_, newValue) => handleShelterChange(newValue)}
                loading={loadingShelters}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Abrigo"
                    placeholder="Selecione um abrigo"
                    required
                    helperText="Selecione o abrigo onde o líder será vinculado"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
              />
            </Grid>

            {selectedShelter && (
              <Grid item xs={12}>
                {loadingTeamsQuantity ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Carregando quantidade de equipes...
                    </Typography>
                  </Box>
                ) : teamsQuantity !== null ? (
                  <TextField
                    select
                    fullWidth
                    label="Número da Equipe"
                    value={numberTeam}
                    onChange={(e) => setNumberTeam(parseInt(e.target.value) || 1)}
                    required
                    helperText={`Selecione o número da equipe (1 a ${teamsQuantity})`}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    {teamNumberOptions.map((num) => (
                      <option key={num} value={num}>
                        Equipe {num}
                      </option>
                    ))}
                  </TextField>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Quantidade de equipes não definida
                    </Typography>
                    <Typography variant="body2">
                      Este abrigo não possui quantidade de equipes definida. Por favor, vá na aba de <strong>Abrigos</strong>, 
                      edite este abrigo e defina a quantidade de equipes antes de vincular líderes.
                    </Typography>
                  </Alert>
                )}
              </Grid>
            )}

            {selectedShelter && teamsQuantity !== null && (
              <Grid item xs={12}>
                <Alert severity="info">
                  O abrigo <strong>{selectedShelter.name}</strong> possui <strong>{teamsQuantity}</strong> equipe(s).
                  {leader.shelter?.id === selectedShelter.id
                    ? " O líder será movido para a equipe selecionada."
                    : " O líder será vinculado à equipe selecionada."}
                </Alert>
              </Grid>
            )}
          </Grid>
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
          disabled={loading || !selectedShelter || !numberTeam || numberTeam < 1 || teamsQuantity === null}
        >
          {loading ? "Salvando..." : "Vincular"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

