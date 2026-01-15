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
import { LeaderProfile, ShelterSimple } from "../types";
import { apiManageLeaderTeam } from "../api";
import { apiFetchSheltersSimple, apiGetShelterTeamsQuantity } from "../../shelters/api";

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

  useEffect(() => {
    if (open) {
      loadShelters();
    }
  }, [open]);

  useEffect(() => {
    const firstShelter = leader?.shelters?.[0];
    if (open && firstShelter) {
      const currentShelter = shelters.find((s) => s.id === firstShelter?.id);
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
      setShelters((data || []).map(s => ({
        id: s.id,
        name: s.name,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })));
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
      if (data.teamsQuantity === 0 || data.teamsQuantity === null || data.teamsQuantity === undefined) {
        setTeamsQuantity(null);
      } else {
        setTeamsQuantity(data.teamsQuantity);
        const firstShelter = leader?.shelters?.[0];
        const firstTeam = firstShelter?.teams?.[0];
        if (firstShelter?.id === shelterId && firstTeam?.numberTeam) {
          setNumberTeam(firstTeam.numberTeam);
        } else {
          setNumberTeam(1);
        }
      }
    } catch (err: any) {
      setTeamsQuantity(null);
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
              {leader.shelters && leader.shelters.length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Abrigo atual: <strong>{leader.shelters[0].name}</strong>
                  </Typography>
                  {leader.shelters[0].teams?.[0]?.numberTeam && (
                    <Typography variant="body2" color="text.secondary">
                      Equipe atual: <strong>Equipe {leader.shelters[0].teams[0].numberTeam}</strong>
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
                  {leader.shelters?.[0]?.id === selectedShelter.id
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
