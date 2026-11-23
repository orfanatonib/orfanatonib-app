import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Stack, Switch, TextField, Typography, useMediaQuery, useTheme,
  Alert, CircularProgress, Chip, Divider
} from "@mui/material";
import { useEffect, useState } from "react";
import { apiCreateAcceptedChrist } from "@/features/accepted-christs";
import type { ShelteredSimpleResponseDto } from "@/features/sheltered/types";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { DECISION_TESTID_PREFIX as TID, MIN_TOUCH_TARGET_PX } from "../constants";

interface Props {
  open: boolean;
  onClose: () => void;
  sheltered: ShelteredSimpleResponseDto;
  onSuccess?: () => void;
}

export default function DecisionModal({ open, onClose, sheltered, onSuccess }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const acceptedChrists = sheltered.acceptedChrists || [];
  const hasAccepted = acceptedChrists.some(ac => ac.decision === "ACCEPTED");

  const title = hasAccepted
    ? "Registrar nova decisão espiritual"
    : "A criança fez a decisão de aceitar Jesus?";

  const [decision, setDecision] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = decision;

  const handleClose = () => {
    setDecision(false);
    setNotes("");
    setError("");
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setDecision(false);
      setNotes("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await apiCreateAcceptedChrist({
        shelteredId: sheltered.id,
        decision: hasAccepted ? "RECONCILED" : "ACCEPTED",
        notes: notes.trim() || null,
      });
      if (onSuccess) await onSuccess();
      handleClose();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Erro ao salvar decisão espiritual"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : handleClose} 
      fullWidth 
      maxWidth="sm"
      data-testid={`${TID}-dialog`}
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          mx: { xs: 2, sm: 4 },
        }
      }}
    >
      <DialogTitle 
        data-testid={`${TID}-title`}
        sx={{ 
          fontSize: { xs: "1rem", sm: "1.2rem" },
          fontWeight: 800,
          pb: 1,
          pt: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ position: "relative", overflow: "hidden", px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        <Box sx={{
          position: "absolute", top: -30, right: -20,
          opacity: 0.08, transform: "rotate(15deg)",
          fontSize: { xs: 120, sm: 160 }, color: theme.palette.error.main, pointerEvents: "none"
        }}>
          <FavoriteIcon fontSize="inherit" />
        </Box>
        <Box sx={{
          position: "absolute", bottom: -30, left: -20,
          opacity: 0.08, transform: "rotate(-15deg)",
          fontSize: { xs: 120, sm: 160 }, color: theme.palette.error.main, pointerEvents: "none"
        }}>
          <FavoriteIcon fontSize="inherit" />
        </Box>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ 
            mb: 2, 
            p: { xs: 1.5, sm: 2 }, 
            bgcolor: "rgba(255, 152, 0, 0.08)",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(255, 152, 0, 0.2)"
          }}>
            <Typography sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" }, color: "text.secondary", mb: 0.5 }}>
              Acolhido(a)
            </Typography>
            <Typography data-testid={`${TID}-sheltered-name`} sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, fontWeight: 700 }}>
              {sheltered.name}
            </Typography>
          </Box>

          {hasAccepted && (
            <Box sx={{ mb: 2 }}>
              <Chip
                data-testid={`${TID}-already-accepted`}
                label="✓ Já aceitou Cristo"
                color="success"
                size={isMobile ? "small" : "medium"}
                icon={<FavoriteIcon />}
                sx={{ fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
              />
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1.5, 
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                fontWeight: 600,
                color: "text.secondary"
              }}
            >
              {hasAccepted 
                ? "Deseja registrar reconciliação com Cristo?" 
                : "Confirmar decisão de aceitar Jesus?"}
            </Typography>

            <RowSwitch
              icon={<CheckCircleIcon />}
              label={hasAccepted ? "Sim, registrar reconciliação" : "Sim, aceitar Jesus"}
              checked={decision}
              onChange={setDecision}
              testId={`${TID}-switch`}
            />
          </Box>

          <TextField
            label="Observações (opcional, máximo 500 caracteres)"
            inputProps={{ "data-testid": `${TID}-notes` }}
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            margin="normal"
            value={notes}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 500) {
                setNotes(value);
              }
            }}
            helperText={`${notes.length}/500 caracteres`}
            FormHelperTextProps={{ "data-testid": `${TID}-notes-count` } as React.HTMLAttributes<HTMLParagraphElement>}
            InputProps={{
              sx: { fontSize: { xs: "0.85rem", sm: "0.95rem" } },
            }}
            sx={{ mt: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")} data-testid={`${TID}-error`}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          data-testid={`${TID}-cancel`}
          sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" }, minHeight: MIN_TOUCH_TARGET_PX }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          variant="contained"
          data-testid={`${TID}-submit`}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FavoriteIcon />}
          sx={{ 
            fontSize: { xs: "0.85rem", sm: "0.95rem" },
            fontWeight: 700,
            px: { xs: 2, sm: 3 },
            minHeight: MIN_TOUCH_TARGET_PX,
          }}
        >
          {loading ? "Salvando..." : "Salvar decisão"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RowSwitch({
  icon,
  label,
  checked,
  onChange,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <FormControlLabel
      control={
        <Switch 
          checked={checked} 
          onChange={(_, v) => onChange(v)}
          color="primary"
          inputProps={{ "data-testid": testId } as React.InputHTMLAttributes<HTMLInputElement>}
        />
      }
      label={
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ 
            "& svg": { 
              fontSize: { xs: "1.1rem", sm: "1.3rem" }, 
              opacity: 0.9,
              color: checked ? "primary.main" : "text.secondary"
            } 
          }}>
            {icon}
          </Box>
          <Typography 
            fontWeight={700} 
            sx={{ 
              fontSize: { xs: "0.85rem", sm: "1rem" },
              color: checked ? "text.primary" : "text.secondary"
            }}
          >
            {label}
          </Typography>
        </Stack>
      }
      labelPlacement="start"
      sx={{
        m: 0,
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1, sm: 1.25 },
        borderRadius: 2,
        justifyContent: "space-between",
        bgcolor: checked 
          ? "rgba(25, 118, 210, 0.08)"
          : (theme) => theme.palette.action.hover,
        border: "2px solid",
        borderColor: checked 
          ? "primary.main"
          : "transparent",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: checked 
            ? "rgba(25, 118, 210, 0.12)"
            : (theme) => theme.palette.action.selected,
        }
      }}
    />
  );
}
