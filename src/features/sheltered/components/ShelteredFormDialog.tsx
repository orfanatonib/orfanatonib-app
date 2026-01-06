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
  const isTeacher = user?.role === UserRole.TEACHER;
  const isLeader = user?.role === UserRole.LEADER;
  
  // Verificar abrigo do teacher
  const teacherShelter = React.useMemo(() => {
    if (!user?.teacherProfile) return null;
    
    // Caminho padrão: teacherProfile.team.shelter
    if ((user.teacherProfile as any)?.team?.shelter?.id) {
      return (user.teacherProfile as any).team.shelter;
    }
    
    // Caminho alternativo: teacherProfile.shelter (caso exista)
    if ((user.teacherProfile as any)?.shelter?.id) {
      return (user.teacherProfile as any).shelter;
    }
    
    return null;
  }, [user?.teacherProfile]);
  
  // Verificar abrigo do líder
  const leaderShelter = React.useMemo(() => {
    if (!user?.leaderProfile) return null;
    
    // A API retorna leaderProfile.teams (array), então pega o primeiro team com shelter
    if (user.leaderProfile.teams && Array.isArray(user.leaderProfile.teams)) {
      const teamWithShelter = user.leaderProfile.teams.find((t: any) => t?.shelter?.id);
      if (teamWithShelter?.shelter) {
        return teamWithShelter.shelter;
      }
    }
    
    // Tenta também o caminho singular (caso exista)
    if ((user.leaderProfile as any)?.team?.shelter?.id) {
      return (user.leaderProfile as any).team.shelter;
    }
    
    return null;
  }, [user?.leaderProfile]);
  
  const teacherShelterId = teacherShelter?.id ?? null;
  const leaderShelterId = leaderShelter?.id ?? null;
  const effectiveShelterForUser = isTeacher ? teacherShelterId : (isLeader ? leaderShelterId : null);

  const [shelterOptions, setShelterOptions] = React.useState<Array<{ id: string; detalhe: string; leader: boolean }>>([]);
  const [loadingShelterDetail, setLoadingShelterDetail] = React.useState(false);
  const [shelterDetailErr, setShelterDetailErr] = React.useState<string>("");
  const [showErrors, setShowErrors] = React.useState(false);

  // Estados para os DatePickers
  const [birthDate, setBirthDate] = React.useState<Dayjs | null>(null);
  const [joinedAt, setJoinedAt] = React.useState<Dayjs | null>(null);

  const setField = <K extends keyof (CreateShelteredForm & EditShelteredForm)>(key: K, val: any) =>
    onChange({ ...(value as any), [key]: val } as any);

  const effectiveShelterId = (value as any)?.shelterId ?? null;

  // Para teacher: sempre define o abrigo vinculado (não pode alterar)
  // Para leader: define apenas se não tiver um abrigo já selecionado
  React.useEffect(() => {
    if (!value) return;
    if (!isTeacher && !isLeader) return;
    
    if (isTeacher && effectiveShelterForUser) {
      // Teacher: sempre força o abrigo vinculado
      if ((value as any).shelterId !== effectiveShelterForUser) {
        setField("shelterId", effectiveShelterForUser);
      }
    } else if (isLeader && effectiveShelterForUser && !(value as any).shelterId) {
      // Leader: apenas pré-seleciona se não tiver um abrigo já escolhido
      setField("shelterId", effectiveShelterForUser);
    }
  }, [value, isTeacher, isLeader, effectiveShelterForUser]);

  React.useEffect(() => {
    if (!open) return;
    
    // Sempre chama o endpoint quando o modal abre
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
          
          // Para teacher: verifica na resposta da API se o professor está vinculado a algum abrigo
          if (isTeacher && user?.id) {
            const teacherProfileId = (user.teacherProfile as any)?.id;
            const userId = user.id;
            
            // Busca o abrigo onde o professor está vinculado
            const teacherShelterFromApi = safe.find((shelter) => {
              // Verifica em todos os teams do abrigo
              return shelter.teams?.some((team: any) => {
                // Verifica se o professor está na lista de teachers do team
                return team.teachers?.some((teacher: any) => {
                  // Compara pelo ID do teacher profile ou pelo ID do user
                  return teacher.id === teacherProfileId || 
                         teacher.user?.id === userId ||
                         (teacher.user && teacher.user.id === userId);
                });
              });
            });
            
            if (teacherShelterFromApi) {
              // Encontrou o abrigo do professor na resposta da API
              const teacherOption = allOptions.find((opt) => opt.id === teacherShelterFromApi.id);
              if (teacherOption) {
                setShelterOptions([teacherOption]);
                // Define automaticamente o abrigo no formulário se ainda não estiver definido
                if (value && !(value as any).shelterId) {
                  setField("shelterId", teacherShelterFromApi.id);
                }
              } else {
                // Se não encontrou na lista mapeada, cria manualmente
                setShelterOptions([{
                  id: teacherShelterFromApi.id,
                  detalhe: teacherShelterFromApi.name || "",
                  leader: false,
                }]);
                // Define automaticamente o abrigo no formulário se ainda não estiver definido
                if (value && !(value as any).shelterId) {
                  setField("shelterId", teacherShelterFromApi.id);
                }
              }
            } else if (teacherShelterId) {
              // Tenta usar o do Redux como fallback
              const teacherOption = allOptions.find((opt) => opt.id === teacherShelterId);
              if (teacherOption) {
                setShelterOptions([teacherOption]);
                if (value && !(value as any).shelterId) {
                  setField("shelterId", teacherShelterId);
                }
              } else if (teacherShelter) {
                setShelterOptions([{
                  id: teacherShelterId,
                  detalhe: teacherShelter.name || "",
                  leader: false,
                }]);
                if (value && !(value as any).shelterId) {
                  setField("shelterId", teacherShelterId);
                }
              } else {
                // Não encontrou abrigo vinculado
                setShelterOptions([]);
              }
            } else {
              // Não tem abrigo vinculado nem no Redux nem na API
              setShelterOptions([]);
            }
          } else if (isLeader) {
            // Para leader: mostra todos os abrigos
            setShelterOptions(allOptions);
            // Pré-seleciona o abrigo do líder se não houver um já selecionado
            if (value && !(value as any).shelterId && leaderShelterId) {
              setField("shelterId", leaderShelterId);
            }
          } else {
            // Para admin/outros: mostra todos
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
  }, [open, isTeacher, isLeader, teacherShelterId, leaderShelterId, teacherShelter, user?.id, user?.teacherProfile]);

  const selectedShelterDetail = React.useMemo(() => {
    if (!effectiveShelterId) return null;
    const found = shelterOptions.find(o => o.id === effectiveShelterId);
    return found?.detalhe ?? null;
  }, [effectiveShelterId, shelterOptions]);

  // Inicializar datas quando o valor mudar ou o dialog abrir
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
            {isTeacher ? (
              // Teacher: mostra apenas o abrigo vinculado (readonly)
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
              // Leader: pode selecionar entre os abrigos disponíveis
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
              // Admin/outros: usa autocomplete
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
