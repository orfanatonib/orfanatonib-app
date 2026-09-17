import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Alert, Box, Typography,
  useMediaQuery, useTheme
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
  open, leader, loading, error, onClose,
}: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [localErr, setLocalErr] = React.useState<string>("");

  React.useEffect(() => {
    setLocalErr("");
  }, [leader]);

  const firstShelter = leader?.shelters?.[0];
  const currentTeamNumber = firstShelter?.teams?.[0]?.numberTeam ?? null;
  const currentShelterName = firstShelter?.name ?? "—";

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      data-testid="leader-link-dialog"
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
          <Alert severity="error" sx={{ mb: 2 }} data-testid="leader-link-dialog-error">
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
        <Button onClick={onClose} variant="contained" data-testid="leader-link-close-button">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
