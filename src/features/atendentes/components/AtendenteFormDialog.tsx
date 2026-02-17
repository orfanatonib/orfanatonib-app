import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Autocomplete,
} from "@mui/material";
import type {
  AtendenteResponseDto,
  CreateAtendenteDto,
  UpdateAtendenteDto,
  AttendableType,
} from "../types";
import { apiListIntegrationsSimple } from "@/features/integration/api";
import { apiListUsersSimple } from "@/features/users/api";
import type { IntegrationResponseDto } from "@/features/integration/types";
import type { UserSimpleDto } from "@/features/users/api";

const ATTENDABLE_NONE = "none" as const;
type AttendableTypeOption = typeof ATTENDABLE_NONE | AttendableType;

type FormData = {
  name: string;
  attendableType: AttendableTypeOption;
  attendableId: string;
};

interface AtendenteFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateAtendenteDto | UpdateAtendenteDto,
    file?: File
  ) => Promise<void>;
  editing?: AtendenteResponseDto | null;
  loading?: boolean;
  error?: string;
}

export default function AtendenteFormDialog({
  open,
  onClose,
  onSubmit,
  editing,
  loading = false,
  error,
}: AtendenteFormDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    attendableType: ATTENDABLE_NONE,
    attendableId: "",
  });
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [integrations, setIntegrations] = React.useState<IntegrationResponseDto[]>(
    []
  );
  const [users, setUsers] = React.useState<UserSimpleDto[]>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [nameRequiredError, setNameRequiredError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      const type = editing?.attendableType ?? ATTENDABLE_NONE;
      setFormData({
        name: editing?.name ?? "",
        attendableType: type === null || type === undefined ? ATTENDABLE_NONE : type,
        attendableId: editing?.attendableId ?? "",
      });
      setPdfFile(null);
      setNameRequiredError("");
    }
  }, [open, editing]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingOptions(true);
    Promise.all([apiListIntegrationsSimple(), apiListUsersSimple()])
      .then(([intData, userData]) => {
        if (!cancelled) {
          setIntegrations(intData ?? []);
          setUsers(userData ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSubmit = async () => {
    const isCreate = !editing;
    if (isCreate && !pdfFile) return;
    const attendableType =
      formData.attendableType === ATTENDABLE_NONE
        ? null
        : (formData.attendableType as AttendableType);
    const attendableId =
      formData.attendableId.trim() === "" ? null : formData.attendableId;

    const hasNoLink = !attendableType && !attendableId;
    if (isCreate && hasNoLink && !formData.name.trim()) {
      setNameRequiredError("Informe o nome da pessoa quando não houver vínculo com integração ou usuário.");
      return;
    }

    if (isCreate) {
      const data: CreateAtendenteDto = {
        name: formData.name.trim() || undefined,
        attendableType,
        attendableId,
        pdf: {
          title: pdfFile?.name ?? "Documento",
          description: "",
          uploadType: "upload",
          mediaType: "document",
          isLocalFile: true,
        },
      };
      await onSubmit(data, pdfFile!);
    } else {
      const data: UpdateAtendenteDto = {
        name: formData.name.trim() || undefined,
        attendableType,
        attendableId,
      };
      if (pdfFile) {
        data.pdf = {
          title: pdfFile.name,
          description: "",
          uploadType: "upload",
          mediaType: "document",
          isLocalFile: true,
        };
      }
      await onSubmit(data, pdfFile ?? undefined);
    }
    onClose();
  };

  const hasNoLink = formData.attendableType === ATTENDABLE_NONE && formData.attendableId.trim() === "";
  const isNameFilledWhenRequired = !hasNoLink || formData.name.trim() !== "";
  const canSubmit = editing ? true : !!pdfFile && isNameFilledWhenRequired;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <DialogTitle>
          <Typography fontWeight="bold">
            {editing ? "Editar Antecedente Criminal" : "Novo Antecedente Criminal"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {(error || nameRequiredError) && (
            <Alert severity="error" onClose={() => {}}>
              {error || nameRequiredError}
            </Alert>
          )}

          <Box>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom color="text.primary">
              {editing ? "Vínculo" : "Vincular a qual?"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {editing
                ? "Altere o vínculo do antecedente criminal, se desejar."
                : "Escolha se este antecedente criminal será vinculado a uma Integração FM, a um Usuário ou a nenhum dos dois."}
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Opção</InputLabel>
              <Select
                value={formData.attendableType}
                label="Opção"
                renderValue={(v) =>
                  v === ATTENDABLE_NONE
                    ? "Nenhum dos dois"
                    : v === "integration"
                      ? "Integração FM"
                      : v === "user"
                        ? "Usuário"
                        : String(v)
                }
                onChange={(e) => {
                  setNameRequiredError("");
                  setFormData((prev) => ({
                    ...prev,
                    attendableType: e.target.value as AttendableTypeOption,
                    attendableId: "",
                  }));
                }}
              >
                <MenuItem value={ATTENDABLE_NONE}>
                  <em>Nenhum dos dois</em>
                </MenuItem>
                <MenuItem value="integration">Integração FM</MenuItem>
                <MenuItem value="user">Usuário</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {formData.attendableType === "integration" && (
            <Autocomplete
              size="small"
              options={integrations}
              getOptionLabel={(option) => option.name || option.id || ""}
              value={integrations.find((i) => i.id === formData.attendableId) ?? null}
              onChange={(_, newValue) => {
                const integration = newValue ?? null;
                setFormData((prev) => ({
                  ...prev,
                  attendableId: integration?.id ?? "",
                  name: integration?.name ?? "",
                }));
              }}
              loading={loadingOptions}
              renderInput={(params) => (
                <TextField {...params} label="Integração" placeholder="Buscar ou selecionar..." />
              )}
              ListboxProps={{
                style: { maxHeight: 280 },
              }}
              noOptionsText="Nenhuma integração encontrada"
            />
          )}

          {formData.attendableType === "user" && (
            <Autocomplete
              size="small"
              options={users}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={users.find((u) => u.id === formData.attendableId) ?? null}
              onChange={(_, newValue) => {
                const user = newValue ?? null;
                setFormData((prev) => ({
                  ...prev,
                  attendableId: user?.id ?? "",
                  name: user?.name ?? "",
                }));
              }}
              loading={loadingOptions}
              renderInput={(params) => (
                <TextField {...params} label="Usuário" placeholder="Buscar por nome ou e-mail..." />
              )}
              ListboxProps={{
                style: { maxHeight: 280 },
              }}
              noOptionsText="Nenhum usuário encontrado"
            />
          )}

          <TextField
            label={hasNoLink ? "Nome (obrigatório)" : "Nome (opcional)"}
            value={formData.name}
            onChange={(e) => {
              setNameRequiredError("");
              setFormData((prev) => ({ ...prev, name: e.target.value }));
            }}
            fullWidth
            size="small"
            required={hasNoLink}
            error={hasNoLink && !formData.name.trim() && !!nameRequiredError}
            helperText={hasNoLink && !formData.name.trim() && nameRequiredError ? nameRequiredError : undefined}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              PDF {editing ? "(deixe em branco para manter o atual)" : "(obrigatório)"}
            </Typography>
            <Button variant="outlined" component="label" fullWidth size="medium">
              {pdfFile
                ? pdfFile.name
                : editing?.pdf?.originalName ?? "Selecionar arquivo PDF"}
              <input
                type="file"
                accept=".pdf,application/pdf"
                hidden
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit || loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {editing ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
