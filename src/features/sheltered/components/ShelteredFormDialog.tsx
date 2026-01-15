import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, Alert, Typography, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Stack, Skeleton, Box, FormHelperText
} from "@mui/material";
import { useSelector } from "react-redux";
import { UserRole } from "@/store/slices/auth/authSlice";
import { CreateShelteredForm, EditShelteredForm } from "../types";
import { apiFetchSheltersSimple } from "@/features/shelters/api";
import ShelterAutocomplete from "@/features/shelters/form/ShelterAutocomplete";
import { RootState } from "@/store/slices";
import { maskCEP, maskPhoneBR } from "@/utils/masks";
import BRDatePicker, { isoToDayjs, dayjsToISO } from "@/components/common/BRDatePicker";
import dayjs, { Dayjs } from "dayjs";

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
  const isMember = user?.role === UserRole.MEMBER;
  const isLeader = user?.role === UserRole.LEADER;

  const memberShelter = React.useMemo(() => {
    if (!user?.memberProfile) return null;

    if ((user.memberProfile as any)?.team?.shelter?.id) {
      return (user.memberProfile as any).team.shelter;
    }

    if ((user.memberProfile as any)?.shelter?.id) {
      return (user.memberProfile as any).shelter;
    }
    
    return null;
  }, [user?.memberProfile]);

  const leaderShelter = React.useMemo(() => {
    if (!user?.leaderProfile) return null;

    if (user.leaderProfile.teams && Array.isArray(user.leaderProfile.teams)) {
      const teamWithShelter = user.leaderProfile.teams.find((t: any) => t?.shelter?.id);
      if (teamWithShelter?.shelter) {
        return teamWithShelter.shelter;
      }
    }

    if ((user.leaderProfile as any)?.team?.shelter?.id) {
      return (user.leaderProfile as any).team.shelter;
    }
    
    return null;
  }, [user?.leaderProfile]);
  
  const memberShelterId = memberShelter?.id ?? null;
  const leaderShelterId = leaderShelter?.id ?? null;
  const effectiveShelterForUser = isMember ? memberShelterId : (isLeader ? leaderShelterId : null);

  const [shelterOptions, setShelterOptions] = React.useState<Array<{ id: string; detalhe: string; leader: boolean }>>([]);
  const [loadingShelterDetail, setLoadingShelterDetail] = React.useState(false);
  const [shelterDetailErr, setShelterDetailErr] = React.useState<string>("");
  const [showErrors, setShowErrors] = React.useState(false);

  const [birthDate, setBirthDate] = React.useState<Dayjs | null>(null);
  const [joinedAt, setJoinedAt] = React.useState<Dayjs | null>(null);

  const setField = <K extends keyof (CreateShelteredForm & EditShelteredForm)>(key: K, val: any) =>
    onChange({ ...(value as any), [key]: val } as any);

  const effectiveShelterId = (value as any)?.shelterId ?? null;

  React.useEffect(() => {
    if (!value) return;
    if (!isMember && !isLeader) return;
    
    if (isMember && effectiveShelterForUser) {
      
      if ((value as any).shelterId !== effectiveShelterForUser) {
        setField("shelterId", effectiveShelterForUser);
      }
    } else if (isLeader && effectiveShelterForUser && !(value as any).shelterId) {
      
      setField("shelterId", effectiveShelterForUser);
    }
  }, [value, isMember, isLeader, effectiveShelterForUser]);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingShelterDetail(true);
        setShelterDetailErr("");
        const items = await apiFetchSheltersSimple();
        if (!cancelled) {
          const safe = Array.isArray(items) ? items : [];
          const allOptions = safe.map((s) => ({
            id: s.id,
            detalhe: s.name,
            leader: false,
          }));

          if (isMember && user?.id) {
            const memberProfileId = (user.memberProfile as any)?.id;
            const userId = user.id;

            const memberShelterFromApi = safe.find((shelter) => {
              
              return shelter.teams?.some((team: any) => {
                
                return team.members?.some((member: any) => {
                  
                  return member.id === memberProfileId || 
                         member.user?.id === userId ||
                         (member.user && member.user.id === userId);
                });
              });
            });
            
            if (memberShelterFromApi) {
              
              const memberOption = allOptions.find((opt) => opt.id === memberShelterFromApi.id);
              if (memberOption) {
                setShelterOptions([memberOption]);
                
                if (value && !(value as any).shelterId) {
                  setField("shelterId", memberShelterFromApi.id);
                }
              } else {
                
                setShelterOptions([{
                  id: memberShelterFromApi.id,
                  detalhe: memberShelterFromApi.name || "",
                  leader: false,
                }]);
                
                if (value && !(value as any).shelterId) {
                  setField("shelterId", memberShelterFromApi.id);
                }
              }
            } else if (memberShelterId) {
              
              const memberOption = allOptions.find((opt) => opt.id === memberShelterId);
              if (memberOption) {
                setShelterOptions([memberOption]);
                if (value && !(value as any).shelterId) {
                  setField("shelterId", memberShelterId);
                }
              } else if (memberShelter) {
                setShelterOptions([{
                  id: memberShelterId,
                  detalhe: memberShelter.name || "",
                  leader: false,
                }]);
                if (value && !(value as any).shelterId) {
                  setField("shelterId", memberShelterId);
                }
              } else {
                
                setShelterOptions([]);
              }
            } else {
              
              setShelterOptions([]);
            }
          } else if (isLeader) {
            
            setShelterOptions(allOptions);
            
            if (value && !(value as any).shelterId && leaderShelterId) {
              setField("shelterId", leaderShelterId);
            }
          } else {
            
            setShelterOptions(allOptions);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setShelterDetailErr(e?.response?.data?.message || e?.message || "Falha ao carregar abrigos");
        }
      } finally {
        if (!cancelled) setLoadingShelterDetail(false);
      }
    })();
    
    return () => { cancelled = true; };
  }, [open, isMember, isLeader, memberShelterId, leaderShelterId, memberShelter, user?.id, user?.memberProfile]);

  const selectedShelterDetail = React.useMemo(() => {
    if (!effectiveShelterId) return null;
    const found = shelterOptions.find(o => o.id === effectiveShelterId);
    return found?.detalhe ?? null;
  }, [effectiveShelterId, shelterOptions]);

  React.useEffect(() => {
    if (value && open) {
      setBirthDate(isoToDayjs((value as any).birthDate));
      setJoinedAt(isoToDayjs((value as any).joinedAt));
    } else {
      setBirthDate(null);
      setJoinedAt(null);
    }
  }, [value, open]);

  if (!value) return null;

  const req = {
    name: !!(value as any).name?.trim(),
    gender: !!(value as any).gender,
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
      <DialogTitle>{isCreate ? "Cadastrar Acolhido" : "Editar Acolhido"}</DialogTitle>

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
            <BRDatePicker
              label="Nascimento"
              value={birthDate}
              onChange={(date) => {
                setBirthDate(date);
                setField("birthDate", dayjsToISO(date));
              }}
              maxDate={dayjs()}
              fullWidth
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
            <BRDatePicker
              label="No abrigo desde"
              value={joinedAt}
              onChange={(date) => {
                setJoinedAt(date);
                setField("joinedAt", dayjsToISO(date));
              }}
              maxDate={dayjs()}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            {isMember ? (
              
              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>
                  Abrigo (obrigatório)
                </Typography>

                {loadingShelterDetail ? (
                  <Skeleton variant="rounded" height={40} />
                ) : shelterOptions.length > 0 && selectedShelterDetail ? (
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
                ) : !loadingShelterDetail && shelterOptions.length === 0 ? (
                  <Alert severity="warning">Seu perfil não possui um abrigo vinculado.</Alert>
                ) : null}

                {showErrors && !req.shelterId && (
                  <Typography variant="caption" color="error">
                    Abrigo é obrigatório
                  </Typography>
                )}
              </Stack>
            ) : isLeader ? (
              
              <FormControl fullWidth required error={showErrors && !req.shelterId}>
                <InputLabel>Abrigo (obrigatório)</InputLabel>
                <Select
                  label="Abrigo (obrigatório)"
                  value={effectiveShelterId || ""}
                  onChange={(e) => setField("shelterId", e.target.value)}
                  disabled={loadingShelterDetail}
                >
                  {shelterOptions.map((shelter) => (
                    <MenuItem key={shelter.id} value={shelter.id}>
                      {shelter.detalhe}
                    </MenuItem>
                  ))}
                </Select>
                {loadingShelterDetail && (
                  <FormHelperText component="div">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={14} />
                      <span>Carregando abrigos...</span>
                    </Stack>
                  </FormHelperText>
                )}
                {shelterDetailErr && !loadingShelterDetail && (
                  <FormHelperText error>{shelterDetailErr}</FormHelperText>
                )}
                {showErrors && !req.shelterId && !loadingShelterDetail && (
                  <FormHelperText error>Selecione um abrigo</FormHelperText>
                )}
              </FormControl>
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
              label="Bairro"
              value={(value as any).address?.district ?? ""}
              onChange={(e) => setField("address", { ...(value as any).address, district: e.target.value })}
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
