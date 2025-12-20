import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Alert, Box, Typography, Stack,
  FormControl, InputLabel, Select, MenuItem, Chip, useMediaQuery, useTheme
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { LeaderProfile, ShelterSimple } from "../types";

type Props = {
  open: boolean;
  leader: LeaderProfile | null;
  shelters: ShelterSimple[];
  onSetShelter: (shelterId: string) => void;
  onClearShelter: () => void;
  loading: boolean;
  error: string;
  onClose: () => void;
};

export default function LeaderLinkDialog({
  open, leader, shelters, onSetShelter, onClearShelter, loading, error, onClose,
}: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedShelterId, setSelectedShelterId] = React.useState<string>("");
  const [localErr, setLocalErr] = React.useState<string>("");

  React.useEffect(() => {
    setSelectedShelterId("");
    setLocalErr("");
  }, [leader]);

  const hasShelter = !!leader?.shelter;
  const currentTeamNumber = leader?.shelter?.number ?? null;
  const currentShelterName = leader?.shelter?.name ?? "—";

  const handleVincular = React.useCallback(() => {
    setLocalErr("");
    if (!selectedShelterId) {
      setLocalErr("Selecione um abrigo para vincular.");
      return;
    }
    onSetShelter(selectedShelterId);
  }, [selectedShelterId, onSetShelter]);

  const handleDesvincular = React.useCallback(() => {
    setLocalErr("");
    onClearShelter();
  }, [onClearShelter]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          width: { xs: "98%", sm: "auto" },
          maxWidth: { xs: "98%", sm: "600px" },
          margin: { xs: "8px", sm: "32px" },
        }
      }}
    >
      <DialogTitle>
        Gerenciar Equipe
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, md: 3 }, position: "relative" }}>
        {(error || localErr) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || localErr}
          </Alert>
        )}

        {!!leader && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography
                component="div"
                sx={{ fontWeight: 700, lineHeight: 1.3 }}
              >
                {leader.user?.name || leader.user?.email || "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Equipe atual: <strong>{currentTeamNumber ? `Equipe ${currentTeamNumber}` : "—"}</strong>
                {currentShelterName && ` (Abrigo: ${currentShelterName})`}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "info.light",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "info.main",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  O gerenciamento de líderes agora é feito através de <strong>Equipes (Teams)</strong>.
                  Use o módulo de Teams para vincular líderes a equipes e abrigos.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
