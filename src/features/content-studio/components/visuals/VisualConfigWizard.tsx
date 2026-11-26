import { AutoAwesome, Replay } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { ContentAudience, VisualFormat, VisualOrientation, type VisualConfig } from "../../types";
import {
  VISUAL_FORMAT_OPTIONS,
  VISUAL_INSTRUCTIONS_MAX,
  VISUAL_ORIENTATION_LABELS,
  VISUAL_QUANTITY_MAX,
  VISUAL_QUANTITY_MIN,
  VISUAL_SETUP_STEPS,
  VISUAL_STYLES_BY_AUDIENCE,
  VISUAL_STYLE_LABELS,
} from "../../visual.constants";
import {
  cutoutKitSummary,
  isValidVisualQuantity,
  isVisualConfigComplete,
  toVisualConfig,
  visualConfigFormFrom,
  visualConfigSummary,
  type VisualConfigForm,
} from "../../visual-config.utils";

interface VisualConfigWizardProps {
  audience: ContentAudience;
  /** Configuração gravada na versão atual (quando já existem visuais). */
  savedConfig: unknown;
  hasVersion: boolean;
  disabled: boolean;
  generating: boolean;
  onGenerate: (config: VisualConfig) => void;
}

/**
 * As perguntas dos visuais da lição, no passo a passo do Clubinho: (1) quantidade, (2) tipo e desenho, (3) formato da
 * página. Só depois de responder é que a geração das imagens começa. Mobile first: tudo em coluna, alvos de 48 px.
 */
export function VisualConfigWizard({ audience, savedConfig, hasVersion, disabled, generating, onGenerate }: VisualConfigWizardProps) {
  const [form, setForm] = useState<VisualConfigForm>(() => visualConfigFormFrom(savedConfig, audience));
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(!hasVersion);

  useEffect(() => {
    setForm(visualConfigFormFrom(savedConfig, audience));
    setStep(0);
    setEditing(!hasVersion);
  }, [audience, hasVersion, savedConfig]);

  const kit = form.format === VisualFormat.CUTOUT_KIT;
  const unit = kit ? "pranchas" : "imagens";
  const validQuantity = isValidVisualQuantity(form.quantity);
  const complete = isVisualConfigComplete(form);
  const stepComplete = step === 0 ? validQuantity : step === 1 ? Boolean(form.format) : Boolean(form.orientation);
  const update = (patch: Partial<VisualConfigForm>) => setForm((current) => ({ ...current, ...patch }));
  const saved = savedConfig && typeof savedConfig === "object" ? (savedConfig as VisualConfig) : null;

  if (hasVersion && !editing && saved) {
    return (
      <Paper data-testid="content-studio-visual-summary" variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography fontWeight={800}>Configuração dos visuais</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {visualConfigSummary(saved)}
        </Typography>
        <Button
          data-testid="content-studio-visual-change"
          startIcon={<Replay />}
          variant="outlined"
          disabled={disabled || generating}
          onClick={() => {
            setStep(0);
            setEditing(true);
          }}
          sx={{ mt: 2, minHeight: 48, width: { xs: "100%", sm: "auto" }, fontWeight: 700 }}
        >
          Alterar escolhas e gerar de novo
        </Button>
      </Paper>
    );
  }

  const generate = () => {
    const config = toVisualConfig(form);
    if (config) onGenerate(config);
  };

  return (
    <Paper data-testid="content-studio-visual-wizard" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight={800}>
        Preparar os visuais da lição
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
        Escolha como quer as imagens. A IA lê a lição aprovada, planeja cada imagem e depois desenha de verdade; você acompanha o
        andamento aqui e pode refazer uma imagem de cada vez.
      </Typography>
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
        {VISUAL_SETUP_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 160 }}>
        {step === 0 && (
          <TextField
            data-testid="content-studio-visual-quantity"
            fullWidth
            type="number"
            label={kit ? "Número de pranchas" : "Quantidade de imagens"}
            value={form.quantity}
            error={form.quantity !== "" && !validQuantity}
            helperText={
              form.quantity !== "" && !validQuantity
                ? `Informe um número de ${VISUAL_QUANTITY_MIN} a ${VISUAL_QUANTITY_MAX}.`
                : kit
                  ? `Kit de recortes com ${VISUAL_QUANTITY_MIN} a ${VISUAL_QUANTITY_MAX} pranchas.${typeof form.quantity === "number" && validQuantity ? ` ${cutoutKitSummary(form.quantity)}` : ""}`
                  : `A IA divide a lição em ${VISUAL_QUANTITY_MIN} a ${VISUAL_QUANTITY_MAX} cenas, conforme o número informado.`
            }
            slotProps={{ htmlInput: { min: VISUAL_QUANTITY_MIN, max: VISUAL_QUANTITY_MAX, step: 1, inputMode: "numeric" } }}
            onChange={(event) => update({ quantity: event.target.value === "" ? "" : Number(event.target.value) })}
          />
        )}

        {step === 1 && (
          <Stack spacing={2.5}>
            <RadioGroup
              data-testid="content-studio-visual-format"
              aria-label="Tipo dos visuais"
              value={form.format}
              onChange={(event) => update({ format: event.target.value as VisualFormat })}
            >
              <Stack spacing={1}>
                {VISUAL_FORMAT_OPTIONS.map((option) => (
                  <Paper key={option.value} variant="outlined" sx={{ px: 1.5, py: 1 }}>
                    <FormControlLabel
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography fontWeight={700}>{option.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0, width: "100%", minHeight: 48 }}
                    />
                  </Paper>
                ))}
              </Stack>
            </RadioGroup>
            <Box>
              <Typography id="visual-style-label" fontWeight={800} sx={{ mb: 1 }}>
                Desenho
              </Typography>
              <RadioGroup
                data-testid="content-studio-visual-style"
                aria-labelledby="visual-style-label"
                value={form.style}
                onChange={(event) => update({ style: event.target.value as VisualConfig["style"] })}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  {VISUAL_STYLES_BY_AUDIENCE[audience].map((style) => (
                    <Paper key={style} variant="outlined" sx={{ px: 1.5, py: 1, flex: 1 }}>
                      <FormControlLabel
                        value={style}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography fontWeight={700}>{VISUAL_STYLE_LABELS[style].title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {VISUAL_STYLE_LABELS[style].description}
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, width: "100%", minHeight: 48 }}
                      />
                    </Paper>
                  ))}
                </Stack>
              </RadioGroup>
            </Box>
          </Stack>
        )}

        {step === 2 && (
          <FormControl fullWidth>
            <InputLabel id="visual-orientation-label">Formato da página</InputLabel>
            <Select
              data-testid="content-studio-visual-orientation"
              labelId="visual-orientation-label"
              label="Formato da página"
              value={form.orientation}
              onChange={(event) => update({ orientation: event.target.value as VisualOrientation })}
            >
              {Object.values(VisualOrientation).map((orientation) => (
                <MenuItem key={orientation} value={orientation} sx={{ minHeight: 48 }}>
                  {VISUAL_ORIENTATION_LABELS[orientation]}
                </MenuItem>
              ))}
            </Select>
            {complete && typeof form.quantity === "number" && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Serão {form.quantity} {unit} em formato {form.orientation === VisualOrientation.PORTRAIT ? "vertical" : "horizontal"}, como “
                {VISUAL_FORMAT_OPTIONS.find((option) => option.value === form.format)?.title}”, com desenho “
                {VISUAL_STYLE_LABELS[form.style].title}”.
              </Alert>
            )}
            <TextField
              data-testid="content-studio-visual-instructions"
              fullWidth
              multiline
              minRows={2}
              label="Alguma orientação extra? (opcional)"
              placeholder="Ex.: use cores mais suaves ou destaque um personagem."
              value={form.instructions}
              onChange={(event) => update({ instructions: event.target.value })}
              slotProps={{ htmlInput: { maxLength: VISUAL_INSTRUCTIONS_MAX } }}
              helperText={`${form.instructions.length}/${VISUAL_INSTRUCTIONS_MAX} caracteres`}
              sx={{ mt: 2 }}
            />
          </FormControl>
        )}
      </Box>

      <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mt: 2 }}>
        <Button sx={{ minHeight: 48 }} disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          Voltar
        </Button>
        {step < VISUAL_SETUP_STEPS.length - 1 ? (
          <Button
            data-testid="content-studio-visual-next"
            variant="contained"
            sx={{ minHeight: 48, fontWeight: 700 }}
            disabled={!stepComplete}
            onClick={() => setStep((current) => current + 1)}
          >
            Continuar
          </Button>
        ) : (
          <Button
            data-testid="content-studio-visual-generate"
            startIcon={<AutoAwesome />}
            variant="contained"
            sx={{ minHeight: 48, fontWeight: 700 }}
            disabled={!complete || disabled || generating}
            onClick={generate}
          >
            {generating ? "Gerando imagens…" : hasVersion ? "Aplicar e gerar de novo" : "Gerar imagens"}
          </Button>
        )}
      </Stack>
      {hasVersion && (
        <Button sx={{ mt: 1, minHeight: 48 }} onClick={() => setEditing(false)} disabled={generating}>
          Cancelar alteração
        </Button>
      )}
    </Paper>
  );
}

