import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import dayjs, { type Dayjs } from "dayjs";
import type { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";
import { maskCEP, maskPhoneBR } from "@/utils/masks";
import BRDatePicker, { dayjsToISO, isoToDayjs } from "@/components/common/BRDatePicker";
import ShelterAutocomplete from "@/features/shelters/form/ShelterAutocomplete";
import {
  GENDER_LABELS,
  MIN_TOUCH_TARGET_PX,
  SHELTERED_MESSAGES,
  SHELTERED_TESTID,
} from "../constants";
import { ShelteredFormMode, ShelteredGender } from "../enums";
import { useShelterOptions } from "../hooks";
import type { ShelteredAddressForm, ShelteredFormValue } from "../types";

type Props = {
  mode: ShelteredFormMode;
  open: boolean;
  value: ShelteredFormValue | null;
  onChange: (value: ShelteredFormValue) => void;
  onCancel: () => void;
  onSubmit: () => void;
  error: string;
  loading: boolean;
};

type RequiredFields = {
  name: boolean;
  gender: boolean;
  city: boolean;
  state: boolean;
  shelterId: boolean;
};

const isGender = (value: string): value is ShelteredGender =>
  value === ShelteredGender.MALE || value === ShelteredGender.FEMALE;

export default function ShelteredFormDialog({
  mode,
  open,
  value,
  onChange,
  onCancel,
  onSubmit,
  error,
  loading,
}: Props) {
  const isCreate = mode === ShelteredFormMode.CREATE;
  const user = useSelector((state: RootState) => state.auth.user);
  const isMember = user?.role === UserRole.MEMBER;
  const isLeader = user?.role === UserRole.LEADER;

  const {
    options: shelterOptions,
    loading: loadingShelters,
    error: shelterError,
    enforcedShelterId,
  } = useShelterOptions(open, user);

  const [showErrors, setShowErrors] = React.useState(false);
  const [birthDate, setBirthDate] = React.useState<Dayjs | null>(null);
  const [joinedAt, setJoinedAt] = React.useState<Dayjs | null>(null);

  const valueRef = React.useRef(value);
  valueRef.current = value;

  const selectedShelterId = value?.shelterId ?? null;

  const setField = React.useCallback(
    <TKey extends keyof ShelteredFormValue>(
      key: TKey,
      fieldValue: ShelteredFormValue[TKey],
    ) => {
      if (!value) return;
      onChange({ ...value, [key]: fieldValue });
    },
    [onChange, value],
  );

  const setAddressField = (
    key: keyof ShelteredAddressForm,
    fieldValue: string,
  ): void => {
    if (!value) return;
    const current: ShelteredAddressForm = value.address ?? { city: "", state: "" };
    onChange({ ...value, address: { ...current, [key]: fieldValue } });
  };

  // A member is pinned to their own shelter; a leader only gets it as a default.
  React.useEffect(() => {
    if (!open || !value || !enforcedShelterId) return;
    if (isMember && value.shelterId !== enforcedShelterId) {
      setField("shelterId", enforcedShelterId);
      return;
    }
    if (isLeader && !value.shelterId) {
      setField("shelterId", enforcedShelterId);
    }
  }, [open, value, enforcedShelterId, isMember, isLeader, setField]);

  // Identidade do registro em edição: muda ao abrir o diálogo ou ao trocar de
  // acolhido, e só nesses momentos o picker deve ser resincronizado.
  const recordKey = !open ? null : value && "id" in value ? value.id : "create";

  React.useEffect(() => {
    if (!open) {
      setBirthDate(null);
      setJoinedAt(null);
      setShowErrors(false);
      return;
    }
    // Intencionalmente lê `value` apenas na abertura: ressincronizar a cada
    // tecla apagaria as seções já digitadas enquanto a data está incompleta.
    setBirthDate(isoToDayjs(valueRef.current?.birthDate));
    setJoinedAt(isoToDayjs(valueRef.current?.joinedAt));
    setShowErrors(false);
  }, [open, recordKey]);

  if (!value) return null;

  const required: RequiredFields = {
    name: Boolean(value.name?.trim()),
    gender: Boolean(value.gender),
    city: Boolean(value.address?.city?.trim()),
    state: Boolean(value.address?.state?.trim()),
    shelterId: Boolean(selectedShelterId),
  };
  const hasErrors = Object.values(required).some((valid) => !valid);

  const handleSubmit = () => {
    setShowErrors(true);
    if (!hasErrors) onSubmit();
  };

  const selectedShelterName =
    shelterOptions.find((option) => option.id === selectedShelterId)?.name ?? null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      data-testid={SHELTERED_TESTID.FORM_DIALOG}
      aria-labelledby="sheltered-form-dialog-title"
    >
      <DialogTitle id="sheltered-form-dialog-title">
        {isCreate ? "Cadastrar Acolhido" : "Editar Acolhido"}
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} data-testid="sheltered-form-error">
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Nome"
              value={value.name ?? ""}
              onChange={(event) => setField("name", event.target.value)}
              error={showErrors && !required.name}
              helperText={showErrors && !required.name ? "Informe o nome" : undefined}
              data-testid="sheltered-form-name"
              inputProps={{ "aria-label": "Nome do acolhido" }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth required error={showErrors && !required.gender}>
              <InputLabel id="sheltered-form-gender-label">Gênero</InputLabel>
              <Select
                labelId="sheltered-form-gender-label"
                label="Gênero"
                value={value.gender ?? ""}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isGender(next)) setField("gender", next);
                }}
                data-testid="sheltered-form-gender"
              >
                <MenuItem
                  value={ShelteredGender.MALE}
                  data-testid="sheltered-form-gender-male"
                >
                  {GENDER_LABELS[ShelteredGender.MALE]}
                </MenuItem>
                <MenuItem
                  value={ShelteredGender.FEMALE}
                  data-testid="sheltered-form-gender-female"
                >
                  {GENDER_LABELS[ShelteredGender.FEMALE]}
                </MenuItem>
              </Select>
              {showErrors && !required.gender && (
                <FormHelperText>Selecione o gênero</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box data-testid="sheltered-form-birth-date">
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
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Responsável"
              value={value.guardianName ?? ""}
              onChange={(event) => setField("guardianName", event.target.value)}
              data-testid="sheltered-form-guardian-name"
              inputProps={{ "aria-label": "Nome do responsável" }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefone"
              placeholder="(DD) 9XXXX-XXXX"
              inputMode="numeric"
              value={maskPhoneBR(value.guardianPhone ?? "")}
              onChange={(event) =>
                setField("guardianPhone", maskPhoneBR(event.target.value))
              }
              data-testid="sheltered-form-guardian-phone"
              inputProps={{ "aria-label": "Telefone do responsável" }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box data-testid="sheltered-form-joined-at">
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
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            {isMember ? (
              <Stack spacing={0.75} data-testid="sheltered-form-shelter-readonly">
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8 }}>
                  Abrigo (obrigatório)
                </Typography>

                {loadingShelters ? (
                  <Skeleton
                    variant="rounded"
                    height={40}
                    data-testid="sheltered-form-shelter-loading"
                  />
                ) : selectedShelterName ? (
                  <Box
                    title={selectedShelterName}
                    sx={{
                      px: 1.25,
                      py: 1,
                      minHeight: MIN_TOUCH_TARGET_PX,
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 1.5,
                      bgcolor: "action.hover",
                      border: "1px solid",
                      borderColor:
                        showErrors && !required.shelterId ? "error.main" : "divider",
                      fontWeight: 700,
                    }}
                  >
                    {selectedShelterName}
                  </Box>
                ) : (
                  <Alert severity="warning" data-testid="sheltered-form-shelter-missing">
                    {SHELTERED_MESSAGES.MEMBER_WITHOUT_SHELTER}
                  </Alert>
                )}

                {showErrors && !required.shelterId && (
                  <Typography variant="caption" color="error">
                    Abrigo é obrigatório
                  </Typography>
                )}
              </Stack>
            ) : isLeader ? (
              <FormControl fullWidth required error={showErrors && !required.shelterId}>
                <InputLabel id="sheltered-form-shelter-label">Abrigo</InputLabel>
                <Select
                  labelId="sheltered-form-shelter-label"
                  label="Abrigo"
                  value={selectedShelterId ?? ""}
                  onChange={(event) => setField("shelterId", event.target.value)}
                  disabled={loadingShelters}
                  data-testid="sheltered-form-shelter-select"
                >
                  {shelterOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
                {loadingShelters && (
                  <FormHelperText component="div">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={14} />
                      <span>Carregando abrigos...</span>
                    </Stack>
                  </FormHelperText>
                )}
                {shelterError && !loadingShelters && (
                  <FormHelperText error data-testid="sheltered-form-shelter-error">
                    {shelterError}
                  </FormHelperText>
                )}
                {showErrors && !required.shelterId && !loadingShelters && (
                  <FormHelperText error>Selecione um abrigo</FormHelperText>
                )}
              </FormControl>
            ) : (
              <Box data-testid="sheltered-form-shelter-autocomplete">
                <ShelterAutocomplete
                  value={selectedShelterId}
                  onChange={(id) => setField("shelterId", id)}
                  required
                  label="Abrigo (obrigatório)"
                  errorText={
                    showErrors && !required.shelterId ? "Selecione um abrigo" : undefined
                  }
                  fetchOnMount
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={700}>
              Endereço
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Rua"
              value={value.address?.street ?? ""}
              onChange={(event) => setAddressField("street", event.target.value)}
              data-testid="sheltered-form-street"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Número"
              value={value.address?.number ?? ""}
              onChange={(event) => setAddressField("number", event.target.value)}
              data-testid="sheltered-form-number"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Bairro"
              value={value.address?.district ?? ""}
              onChange={(event) => setAddressField("district", event.target.value)}
              data-testid="sheltered-form-district"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Cidade"
              value={value.address?.city ?? ""}
              onChange={(event) => setAddressField("city", event.target.value)}
              error={showErrors && !required.city}
              helperText={showErrors && !required.city ? "Informe a cidade" : undefined}
              data-testid="sheltered-form-city"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="UF"
              value={value.address?.state ?? ""}
              onChange={(event) => setAddressField("state", event.target.value)}
              error={showErrors && !required.state}
              helperText={showErrors && !required.state ? "Informe a UF" : undefined}
              data-testid="sheltered-form-state"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="CEP"
              placeholder="00000-000"
              inputMode="numeric"
              value={maskCEP(value.address?.postalCode ?? "")}
              onChange={(event) =>
                setAddressField("postalCode", maskCEP(event.target.value))
              }
              data-testid="sheltered-form-postal-code"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Complemento"
              value={value.address?.complement ?? ""}
              onChange={(event) => setAddressField("complement", event.target.value)}
              data-testid="sheltered-form-complement"
            />
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ mt: 2, textAlign: "center" }} data-testid="sheltered-form-loading">
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onCancel}
          sx={{ color: "text.secondary", minHeight: MIN_TOUCH_TARGET_PX }}
          data-testid="sheltered-form-cancel"
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ minHeight: MIN_TOUCH_TARGET_PX }}
          data-testid="sheltered-form-submit"
        >
          {isCreate ? "Criar" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
