import Add from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

import { createContentPackage } from "../api";
import { EMPTY_STUDIO_FORM } from "../workspace.constants";
import type { ContentStudioCatalogResponse, CreateContentPackagePayload } from "../types";
import { formatAudienceAgeRange } from "../utils";

const THEME_MAX = 180;
const REFERENCES_MAX = 500;

interface PackageFormDialogProps {
  open: boolean;
  catalog: ContentStudioCatalogResponse;
  onClose: () => void;
  /** Chamado com o id do material criado (a tela navega para ele). */
  onCreated: (packageId: string) => void;
}

type FieldErrors = Partial<Record<"theme" | "biblicalReferences" | "canonicalObjective", string>>;

/** Criação de um material para visita: faixa etária, tema, referências e objetivo da visita. */
export function PackageFormDialog({ open, catalog, onClose, onCreated }: PackageFormDialogProps) {
  const [form, setForm] = useState<CreateContentPackagePayload>(EMPTY_STUDIO_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const audience = catalog.audiences.find((item) => item.audience === form.audience);

  const change = (field: keyof CreateContentPackagePayload) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (field in errors) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    const payload: CreateContentPackagePayload = {
      audience: form.audience,
      theme: form.theme.trim(),
      biblicalReferences: form.biblicalReferences.trim(),
      canonicalObjective: form.canonicalObjective.trim(),
      canonicalNotes: form.canonicalNotes?.trim() || null,
    };

    const nextErrors: FieldErrors = {};
    if (!payload.theme) nextErrors.theme = "Diga o tema da visita.";
    if (!payload.biblicalReferences) nextErrors.biblicalReferences = "Informe ao menos uma referência bíblica.";
    if (!payload.canonicalObjective) nextErrors.canonicalObjective = "Descreva o objetivo da visita.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("Preencha tema, referências bíblicas e objetivo da visita.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createContentPackage(payload);
      setForm(EMPTY_STUDIO_FORM);
      onCreated(created.id);
    } catch {
      setSubmitError("Não foi possível criar o material agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" data-testid="content-studio-create-dialog">
      <DialogTitle>Novo material para visita</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate data-testid="content-studio-package-form">
        <DialogContent>
          <Stack spacing={2.5}>
            <Typography color="text.secondary">
              Conte o essencial da visita. Depois você gera e revisa cada etapa (lição, discussão, atividade, apoios visuais e roteiro).
            </Typography>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              select
              label="Faixa etária"
              value={form.audience}
              onChange={change("audience")}
              helperText={audience ? `${audience.name} · ${formatAudienceAgeRange(audience)}` : undefined}
              data-testid="content-studio-create-audience"
            >
              {catalog.audiences.map((item) => (
                <MenuItem key={item.audience} value={item.audience}>
                  {item.name} · {formatAudienceAgeRange(item)}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Tema da visita"
                placeholder="Ex.: Deus cuida de nós"
                value={form.theme}
                onChange={change("theme")}
                error={!!errors.theme}
                helperText={errors.theme ?? `${form.theme.length}/${THEME_MAX}`}
                inputProps={{ maxLength: THEME_MAX, "data-testid": "content-studio-theme-input" }}
                required
              />
              <TextField
                label="Referências bíblicas"
                placeholder="Ex.: Salmos 23:1-6; João 10:11"
                value={form.biblicalReferences}
                onChange={change("biblicalReferences")}
                error={!!errors.biblicalReferences}
                helperText={errors.biblicalReferences ?? `${form.biblicalReferences.length}/${REFERENCES_MAX}`}
                inputProps={{ maxLength: REFERENCES_MAX, "data-testid": "content-studio-references-input" }}
                required
              />
            </Box>

            <TextField
              label="Objetivo da visita"
              placeholder="O que as pessoas devem sentir ou entender ao final da visita?"
              value={form.canonicalObjective}
              onChange={change("canonicalObjective")}
              error={!!errors.canonicalObjective}
              helperText={errors.canonicalObjective}
              inputProps={{ "data-testid": "content-studio-objective-input" }}
              multiline
              minRows={3}
              required
            />
            <TextField
              label="Orientações adicionais (opcional)"
              placeholder="Cuidados, materiais disponíveis, tempo da visita…"
              value={form.canonicalNotes ?? ""}
              onChange={change("canonicalNotes")}
              inputProps={{ "data-testid": "content-studio-notes-input" }}
              multiline
              minRows={2}
            />
            <FormHelperText>Não inclua nomes, contatos, históricos ou outros dados pessoais de pessoas acolhidas.</FormHelperText>
            {!catalog.capabilities.generation && (
              <Alert severity="info">Você pode criar e editar o material manualmente; a geração por IA está desabilitada.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={submitting} onClick={handleClose} sx={{ minHeight: 44 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={submitting ? <CircularProgress color="inherit" size={18} /> : <Add />}
            disabled={submitting}
            data-testid="content-studio-create-package"
            sx={{ minHeight: 44 }}
          >
            Criar material
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
