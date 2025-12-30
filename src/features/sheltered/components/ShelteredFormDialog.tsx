import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, Alert, Typography, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Stack, Skeleton, Box, FormHelperText
} from "@mui/material";
import { useSelector } from "react-redux";
import { UserRole } from "@/store/slices/auth/authSlice";
import { CreateShelteredForm, EditShelteredForm } from "../types";
import { apiFetchSheltersList } from "@/features/shelters/api";
import ShelterAutocomplete from "@/features/shelters/form/ShelterAutocomplete";
import { RootState } from "@/store/slices";
import { formatDateBR, maskCEP, maskDateBR, maskPhoneBR } from "@/utils/masks";

type Props = {
  mode: "create" | "edit";
  open: boolean;
  value: CreateShelteredForm | EditShelteredForm | null;
  onChange: (v: CreateShelteredForm | EditShelteredForm) => void;
  onCancel: () => void;
  onSubmit: () => void;
  error: string;
  loading: boolean;
};

export default function ShelteredFormDialog({
  mode, open, value, onChange, onCancel, onSubmit, error, loading,
}: Props) {
  const isCreate = mode === "create";
  
  const user = useSelector((state: RootState) => state.auth.user);
  const isTeacher = user?.role === UserRole.TEACHER;
  const teacherShelter =
    user?.teacherProfile?.team?.shelter ??
    user?.teacherProfile?.shelter ??
    null;
  const teacherShelterId = teacherShelter?.id ?? null;

  const [shelterOptions, setShelterOptions] = React.useState<Array<{ id: string; detalhe: string; leader: boolean }>>([]);
  const [loadingShelterDetail, setLoadingShelterDetail] = React.useState(false);
  const [shelterDetailErr, setShelterDetailErr] = React.useState<string>("");
  const [showErrors, setShowErrors] = React.useState(false);

  const setField = <K extends keyof (CreateShelteredForm & EditShelteredForm)>(key: K, val: any) =>
    onChange({ ...(value as any), [key]: val } as any);

  const effectiveShelterId = (value as any)?.shelterId ?? null;

  React.useEffect(() => {
    if (!value) return;
    if (!isTeacher) return;
    if (!teacherShelterId) return;
    if ((value as any).shelterId !== teacherShelterId) {
      setField("shelterId", teacherShelterId);
    }
  }, [value, isTeacher, teacherShelterId]);

  React.useEffect(() => {
    if (!open) return;
    
    if (isTeacher && teacherShelter) {
      setShelterOptions([{
        id: teacherShelter.id,
        detalhe: teacherShelter.name || "",
        leader: false,
      }]);
      return;
    }
    
    if (!isTeacher && shelterOptions.length === 0) {
      let cancelled = false;
      (async () => {
        try {
          setLoadingShelterDetail(true);
          setShelterDetailErr("");
          const items = await apiFetchSheltersList();
          if (!cancelled) {
            const safe = Array.isArray(items) ? items : [];
            setShelterOptions(
              safe.map((s) => ({
                id: s.id,
                detalhe: s.name,
                leader: false,
              }))
            );
          }
        } catch (e: any) {
          if (!cancelled) setShelterDetailErr(e?.response?.data?.message || e?.message || "Falha ao carregar shelters");
        } finally {
          if (!cancelled) setLoadingShelterDetail(false);
        }
      })();
      return () => { cancelled = true; };
    }
  }, [open, isTeacher, teacherShelter, shelterOptions.length]);

  const selectedShelterDetail = React.useMemo(() => {
    if (!effectiveShelterId) return null;
    const found = shelterOptions.find(o => o.id === effectiveShelterId);
    return found?.detalhe ?? null;
  }, [effectiveShelterId, shelterOptions]);

  if (!value) return null;

  const req = {
    name: !!(value as any).name?.trim(),
    gender: !!(value as any).gender,
    birthDate: !!(value as any).birthDate,
    district: !!(value as any).address?.district?.trim(),
    city: !!(value as any).address?.city?.trim(),
    state: !!(value as any).address?.state?.trim(),
    shelterId: !!effectiveShelterId,
  };

  const hasErrors = Object.values(req).some(v => !v);

  const handleSubmitClick = () => {
    setShowErrors(true);
    if (!hasErrors) onSubmit();
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>{isCreate ? "Cadastrar Abrigado" : "Editar Abrigado"}</DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Nome (obrigatório)"
              value={(value as any).name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
              error={showErrors && !req.name}
              helperText={showErrors && !req.name ? "Informe o nome" : undefined}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth required error={showErrors && !req.gender}>
              <InputLabel>Gênero (obrigatório)</InputLabel>
              <Select
                label="Gênero (obrigatório)"
                value={(value as any).gender ?? ""}
                onChange={(e) => setField("gender", e.target.value)}
              >
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Feminino</MenuItem>
              </Select>
              {showErrors && !req.gender && <FormHelperText>Selecione o gênero</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              required
              label="Nascimento (obrigatório)"
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
              value={formatDateBR((value as any).birthDate)}
              onChange={(e) => setField("birthDate", maskDateBR(e.target.value))}
              error={showErrors && !req.birthDate}
              helperText={showErrors && !req.birthDate ? "Informe a data de nascimento" : undefined}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Responsável"
              value={(value as any).guardianName ?? ""}
              onChange={(e) => setField("guardianName", e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefone"
              placeholder="(DD) 9XXXX-XXXX"
              inputMode="numeric"
              value={maskPhoneBR((value as any).guardianPhone ?? "")}
              onChange={(e) => setField("guardianPhone", maskPhoneBR(e.target.value))}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="No abrigo desde"
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
              value={formatDateBR((value as any).joinedAt)}
              onChange={(e) => {
                const v = maskDateBR(e.target.value);
                setField("joinedAt", v ? v : null);
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            {isTeacher ? (
              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>
                  Abrigo (obrigatório)
                </Typography>

                {loadingShelterDetail ? (
                  <Skeleton variant="rounded" height={40} />
                ) : shelterDetailErr ? (
                  <Alert severity="warning">{shelterDetailErr}</Alert>
                ) : selectedShelterDetail ? (
                  <Box
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 1.5,
                      bgcolor: "action.hover",
                      border: "1px solid",
                      borderColor: (showErrors && !req.shelterId) ? "error.main" : "divider",
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                    title={selectedShelterDetail}
                  >
                    {selectedShelterDetail}
                  </Box>
                ) : (
                  <Alert severity="info">Seu perfil não possui um abrigo vinculado.</Alert>
                )}

                {showErrors && !req.shelterId && (
                  <Typography variant="caption" color="error">
                    Selecione um Abrigo
                  </Typography>
                )}
              </Stack>
            ) : (
              <ShelterAutocomplete
                value={effectiveShelterId}
                onChange={(id) => setField("shelterId", id)}
                required
                label="Abrigo (obrigatório)"
                errorText={showErrors && !req.shelterId ? "Selecione um Abrigo" : undefined}
                fetchOnMount
              />
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={700}>Endereço</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Rua"
              value={(value as any).address?.street ?? ""}
              onChange={(e) => setField("address", { ...(value as any).address, street: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Número"
              value={(value as any).address?.number ?? ""}
              onChange={(e) => setField("address", { ...(value as any).address, number: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              required
              label="Bairro (obrigatório)"
              value={(value as any).address?.district ?? ""}
              onChange={(e) => setField("address", { ...(value as any).address, district: e.target.value })}
              error={showErrors && !req.district}
              helperText={showErrors && !req.district ? "Informe o bairro" : undefined}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Cidade (obrigatório)"
              value={(value as any).address?.city ?? ""}
              onChange={(e) => setField("address", { ...(value as any).address, city: e.target.value })}
              error={showErrors && !req.city}
              helperText={showErrors && !req.city ? "Informe a cidade" : undefined}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="UF (obrigatório)"
              value={(value as any).address?.state ?? ""}
              onChange={(e) => setField("address", { ...(value as any).address, state: e.target.value })}
              error={showErrors && !req.state}
              helperText={showErrors && !req.state ? "Informe a UF" : undefined}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="CEP"
              placeholder="00000-000"
              inputMode="numeric"
              value={maskCEP((value as any).address?.postalCode ?? "")}
              onChange={(e) =>
                setField("address", {
                  ...((value as any).address ?? {}),
                  postalCode: maskCEP(e.target.value),
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Complemento"
              value={(value as any).address?.complement ?? ""}
              onChange={(e) => setField("address", { ...(value as any).address, complement: e.target.value })}
            />
          </Grid>
        </Grid>

        {loading && (
          <Typography align="center" sx={{ mt: 2 }}>
            <CircularProgress size={24} />
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} sx={{ color: "text.secondary" }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmitClick}
          disabled={loading}
        >
          {isCreate ? "Criar" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
