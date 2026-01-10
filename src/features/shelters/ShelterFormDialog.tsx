import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Divider,
  Typography, Alert, TextField, FormControl, InputLabel, Select, MenuItem,
  useTheme, useMediaQuery, Box
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import AddressFields from "./form/AddressFields";
import ShelterMediaForm from "./form/ShelterMediaForm";
import {
  LeaderOption, CreateShelterForm, EditShelterForm, TeacherOption
} from "./types";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "@/store/selectors/routeSelectors";

type Props = {
  mode: "create" | "edit";
  open: boolean;
  value: CreateShelterForm | EditShelterForm | null;
  onChange: (val: CreateShelterForm | EditShelterForm) => void;
  onCancel: () => void;
  onSubmit: () => void;
  error: string;
  loading: boolean;
  leaderOptions: LeaderOption[];
  teacherOptions: TeacherOption[];
};

export default function ShelterFormDialog({
  mode, open, value, onChange, onCancel, onSubmit,
  error, loading, leaderOptions, teacherOptions,
}: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const teachersKey = React.useMemo(
    () => (teacherOptions ?? [])
      .map(t => `${t.teacherProfileId}:${t.vinculado ? 1 : 0}`)
      .join("|"),
    [teacherOptions]
  );
  const isAdmin = useSelector(selectIsAdmin);
  const isCreate = mode === "create";


  const [uploadType] = useState<"upload">("upload"); // Upload only
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (value?.mediaItem) {
      // Upload only: não suportamos link
    } else {
      setFile(null);
    }
  }, [value?.mediaItem]);

  const updateMediaItem = (newFile?: File | null) => {
    if (!value) return;

    const mediaItem = (newFile) ? {
      title: "Foto do Abrigo",
      description: "Imagem do abrigo",
      uploadType,
      url: "",
    } : undefined;

    onChange({
      ...value,
      mediaItem,
      file: newFile !== undefined ? (newFile || undefined) : (file || undefined),
    } as any);
  };

  const handleRemoveExistingImage = () => {
    setFile(null);
    onChange({
      ...value,
      mediaItem: undefined,
      file: undefined,
    } as any);
  };

  if (!value) return null;

  const name = (value as any).name ?? "";
  const description = (value as any).description ?? "";
  const teamsQuantity = (value as any).teamsQuantity ?? 1;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
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
      <DialogTitle>{isCreate ? "Criar Abrigo" : "Editar Abrigo"}</DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nome do Abrigo"
              type="text"
              fullWidth
              value={name}
              onChange={(e) => onChange({ ...value, name: e.target.value } as any)}
              placeholder="Ex: Abrigo Central 1"
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Descrição"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => onChange({ ...value, description: e.target.value } as any)}
              placeholder="Descrição do abrigo, missão, objetivos..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Quantidade de Equipes"
              type="number"
              fullWidth
              value={teamsQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                onChange({ ...value, teamsQuantity: val } as any);
              }}
              inputProps={{ min: 1, step: 1 }}
              required
              helperText="Número de equipes (obrigatório, mínimo: 1)"
              error={!teamsQuantity || teamsQuantity < 1}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={700}>Endereço</Typography>
          </Grid>
          <AddressFields
            value={(value as any).address ?? {}}
            onChange={(addr) => onChange({ ...value, address: addr } as any)}
          />

          <Grid item xs={12}><Divider /></Grid>

          <ShelterMediaForm
            file={file}
            setFile={setFile}
            existingImageUrl={value.mediaItem?.url}
            onRemoveExistingImage={handleRemoveExistingImage}
            onFileChange={(newFile) => updateMediaItem(newFile)}
          />
        </Grid>

        {loading && (
          <Typography align="center" sx={{ mt: 2 }}>
            <CircularProgress size={24} />
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} sx={{ color: "text.secondary" }}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={loading}>
          {isCreate ? "Criar" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
