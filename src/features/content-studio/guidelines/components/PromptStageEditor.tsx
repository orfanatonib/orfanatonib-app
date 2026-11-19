import { Add as AddIcon, LightbulbOutlined, RestartAlt, Save } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import React from "react";

import { CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import type { ContentStageType } from "../../types";
import { PROMPT_MAX_LENGTH, PROMPT_PRESETS, PROMPT_STAGE_CONFIG, PROMPT_STAGE_EXAMPLES, PROMPT_TEXTS } from "../constants";
import { stripDuplicatedBasePrompt } from "../drafts";
import type { PromptFeedback, PromptPreference } from "../types";
import { PromptReference } from "./PromptReference";

interface PromptStageEditorProps {
  stage: ContentStageType;
  audienceLabel: string;
  preference: PromptPreference;
  value: string;
  effectivePreview: string;
  dirty: boolean;
  clearing: boolean;
  canSave: boolean;
  busy: boolean;
  saving: boolean;
  resetting: boolean;
  validationMessage: string | null;
  savedLabel: string;
  hasBaseDuplication: boolean;
  recovered: boolean;
  draftOutdated: boolean;
  feedback: PromptFeedback | null;
  onChange: (text: string) => void;
  onInsertPreset: (text: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  onRebase: () => void;
  onOpenReset: () => void;
  onDismissRecovered: () => void;
}

const buttonSx = { borderRadius: 2.5, minHeight: 44, textTransform: "none" } as const;

/** Editor de UMA etapa: texto, sugestões, avisos de rascunho/conflito, ações e as regras oficiais para consulta. */
export const PromptStageEditor: React.FC<PromptStageEditorProps> = (props) => {
  const { stage, preference, value, dirty, clearing, busy, validationMessage } = props;
  return (
    <Paper
      component="section"
      elevation={0}
      aria-labelledby="admin-prompts-stage-title"
      sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1} sx={{ mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id="admin-prompts-stage-title" component="h2" fontWeight={800} sx={{ fontSize: { xs: "1.15rem", sm: "1.35rem" } }}>
            <span aria-hidden>{PROMPT_STAGE_CONFIG[stage].icon} </span>
            {CONTENT_STAGE_TYPE_LABELS[stage]} · {props.audienceLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {PROMPT_STAGE_CONFIG[stage].description}
          </Typography>
        </Box>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={0.75}>
          <Chip
            data-testid="admin-prompts-stage-status"
            color={preference.customPrompt ? "primary" : "default"}
            variant={preference.customPrompt ? "filled" : "outlined"}
            label={preference.customPrompt ? PROMPT_TEXTS.custom : PROMPT_TEXTS.official}
            sx={{ fontWeight: 800, borderRadius: 1.5 }}
          />
          {dirty && <Chip color="warning" label={PROMPT_TEXTS.pending} sx={{ fontWeight: 700, borderRadius: 1.5 }} />}
          {props.savedLabel && (
            <Typography data-testid="admin-prompts-saved-at" variant="caption" color="text.secondary">
              {props.savedLabel}
            </Typography>
          )}
        </Stack>
      </Stack>

      <TextField
        data-testid={`admin-prompt-page-input-${stage}`}
        label={PROMPT_TEXTS.editorLabel}
        placeholder={PROMPT_STAGE_EXAMPLES[stage]}
        disabled={props.resetting}
        value={value}
        onChange={(event) => props.onChange(event.target.value)}
        multiline
        minRows={8}
        maxRows={24}
        fullWidth
        error={Boolean(validationMessage)}
        helperText={
          validationMessage ??
          (clearing
            ? "Campo vazio: ao confirmar, esta etapa volta ao padrão oficial."
            : `${value.length}/${PROMPT_MAX_LENGTH} caracteres · ${PROMPT_TEXTS.saveShortcut}`)
        }
        slotProps={{
          htmlInput: { maxLength: PROMPT_MAX_LENGTH },
          inputLabel: { shrink: true },
          input: { sx: { fontSize: "0.95rem", borderRadius: 3, lineHeight: 1.55 } },
        }}
      />

      <Box sx={{ mt: 1.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
          <LightbulbOutlined fontSize="small" color="primary" />
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            {PROMPT_TEXTS.presetsLabel}
          </Typography>
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {PROMPT_PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              icon={<AddIcon fontSize="small" />}
              label={preset.label}
              onClick={() => props.onInsertPreset(preset.text)}
              variant="outlined"
              disabled={props.resetting}
              sx={{ fontWeight: 600, borderRadius: 2, minHeight: 36 }}
            />
          ))}
        </Stack>
      </Box>

      <Stack gap={1.5} sx={{ mt: 2 }}>
        {props.hasBaseDuplication && (
          <Alert
            data-testid="admin-prompts-duplication-warning"
            severity="warning"
            sx={{ borderRadius: 2.5 }}
            action={
              <Button
                data-testid="admin-prompts-strip-duplicated-base"
                color="inherit"
                size="small"
                onClick={() => props.onChange(stripDuplicatedBasePrompt(value, preference.basePrompt))}
                sx={{ fontWeight: 700, minHeight: 44 }}
              >
                Remover o trecho repetido
              </Button>
            }
          >
            Há trechos das regras oficiais dentro da sua orientação. Elas já são enviadas à IA: deixe aqui só o que é seu, para não repetir nem estourar o
            limite.
          </Alert>
        )}
        {props.recovered && (
          <Alert data-testid="admin-prompts-draft-recovered" severity="info" onClose={props.onDismissRecovered} sx={{ borderRadius: 2.5 }}>
            Rascunho recuperado: o texto que você digitou e não salvou foi restaurado neste navegador.
          </Alert>
        )}
        {props.draftOutdated && (
          <Alert data-testid="admin-prompts-draft-outdated" severity="warning" sx={{ borderRadius: 2.5, "& .MuiAlert-message": { width: "100%" } }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Você alterou esta orientação em outra aba ou aparelho. O texto daqui foi preservado, mas precisa de uma decisão para poder ser salvo.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button data-testid="admin-prompts-draft-rebase" color="inherit" variant="outlined" onClick={props.onRebase} sx={buttonSx}>
                Aplicar meu texto sobre a versão atual
              </Button>
              <Button data-testid="admin-prompts-draft-discard-outdated" color="inherit" onClick={props.onDiscard} sx={buttonSx}>
                Descartar meu texto e ver a versão atual
              </Button>
            </Stack>
          </Alert>
        )}
        {props.feedback && (
          <Alert data-testid="admin-prompts-feedback" severity={props.feedback.severity} sx={{ borderRadius: 2.5 }}>
            {props.feedback.text}
          </Alert>
        )}
      </Stack>

      <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end" gap={1.25} sx={{ mt: 2.5, mb: 3 }}>
        {dirty && (
          <Button data-testid="admin-prompts-discard-draft" disabled={busy} onClick={props.onDiscard} sx={{ ...buttonSx, fontWeight: 600 }}>
            {PROMPT_TEXTS.discard}
          </Button>
        )}
        {!clearing && (
          <Button
            data-testid="admin-prompts-reset-open"
            color="warning"
            variant="outlined"
            startIcon={<RestartAlt />}
            disabled={!preference.customPrompt || busy}
            onClick={props.onOpenReset}
            sx={{ ...buttonSx, fontWeight: 600 }}
          >
            {PROMPT_TEXTS.restore}
          </Button>
        )}
        {clearing ? (
          <Button
            data-testid="admin-prompts-remove"
            variant="contained"
            color="warning"
            startIcon={<RestartAlt />}
            disabled={busy}
            onClick={props.onOpenReset}
            sx={{ ...buttonSx, px: 3, fontWeight: 700 }}
          >
            {PROMPT_TEXTS.remove}
          </Button>
        ) : (
          <Button
            data-testid="admin-prompts-save"
            variant="contained"
            startIcon={<Save />}
            disabled={!props.canSave}
            onClick={props.onSave}
            sx={{ ...buttonSx, px: 3, fontWeight: 700 }}
          >
            {props.saving ? PROMPT_TEXTS.saving : PROMPT_TEXTS.save}
          </Button>
        )}
      </Stack>

      <Typography data-testid="admin-prompts-protected-note" variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {PROMPT_TEXTS.protectedNote}
      </Typography>
      <PromptReference basePrompt={preference.basePrompt} effectivePreview={props.effectivePreview} resetKey={`${props.audienceLabel}:${stage}`} />
    </Paper>
  );
};
