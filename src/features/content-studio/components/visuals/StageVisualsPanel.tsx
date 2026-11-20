import { AutoAwesome } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { useStageImages } from "../../hooks/useStageImages";
import { isGenerationActive } from "../../generation.utils";
import { AiGenerationCapability, VisualOrientation, type ContentGenerationJobResponse, type StageImageItem } from "../../types";
import { VISUAL_INSTRUCTIONS_MAX } from "../../visual.constants";
import { StagePdfTab } from "../StagePdfTab";
import { ImageCarousel } from "./ImageCarousel";

enum VisualsTab {
  IMAGES = "images",
  PDF = "pdf",
}

interface StageVisualsPanelProps {
  packageId: string;
  stageId: string;
  versionKey: string | null;
  orientation: VisualOrientation | undefined;
  job: ContentGenerationJobResponse | null;
  disabled: boolean;
  fileBaseName: string;
  /** Fixação e brincadeira: só a imagem compilada aqui (o documento e o PDF ficam no editor da etapa). */
  showPdf?: boolean;
  title?: string;
  /** Muda quando uma imagem é refeita: o PDF do editor precisa ser refeito junto. */
  onFingerprint?: (fingerprint: string) => void;
  onRegenerate: (slots: string[] | undefined, instructions: string | undefined) => void;
}

/**
 * "Visuais da lição" não tem documento de texto: só as imagens (num carrossel, com "Refazer" uma de cada vez) e o PDF,
 * em que cada imagem vira uma página, na horizontal ou na vertical conforme a escolha.
 */
export function StageVisualsPanel({
  packageId,
  stageId,
  versionKey,
  orientation,
  job,
  disabled,
  fileBaseName,
  showPdf = true,
  title,
  onFingerprint,
  onRegenerate,
}: StageVisualsPanelProps) {
  const drawing = isGenerationActive(job) && job?.capability === AiGenerationCapability.IMAGE_GENERATION;
  const planning = isGenerationActive(job) && job?.capability === AiGenerationCapability.TEXT_STRUCTURED;
  const { data, error } = useStageImages(packageId, stageId, versionKey, drawing);
  const [tab, setTab] = useState<VisualsTab>(VisualsTab.IMAGES);
  const [target, setTarget] = useState<StageImageItem | null>(null);
  const [instructions, setInstructions] = useState("");

  const items = data?.items ?? [];
  const missing = items.filter((item) => !item.assetId);
  const progress = drawing ? job?.progress : null;
  const ratio = orientation === VisualOrientation.PORTRAIT ? "210 / 297" : "297 / 210";
  // O PDF muda quando uma imagem é refeita (a versão do texto continua a mesma).
  const pdfKey = versionKey ? `${versionKey}:${items.map((item) => item.updatedAt ?? "-").join(",")}` : null;
  useEffect(() => {
    onFingerprint?.(pdfKey ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfKey]);
  if (!versionKey && !planning) return null;

  const close = () => {
    setTarget(null);
    setInstructions("");
  };

  return (
    <Stack spacing={2} data-testid="content-studio-visuals-panel">
      {showPdf ? (
        <Tabs value={tab} onChange={(_, next: VisualsTab) => setTab(next)} variant="fullWidth" aria-label="Exibição dos visuais">
          <Tab value={VisualsTab.IMAGES} label="Imagens" data-testid="content-studio-visuals-tab-images" />
          <Tab value={VisualsTab.PDF} label="PDF" data-testid="content-studio-visuals-tab-pdf" />
        </Tabs>
      ) : (
        <Typography variant="h6" fontWeight={800}>
          {title ?? "Imagem compilada"}
        </Typography>
      )}

      {tab === VisualsTab.IMAGES && (
        <Stack spacing={2}>
          {planning && (
            <Alert severity="info" data-testid="content-studio-images-planning">
              A IA está planejando as imagens a partir da lição…
            </Alert>
          )}
          {drawing && (
            <Box data-testid="content-studio-images-progress">
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {progress ? `Desenhando ${Math.min(progress.done + 1, progress.total)} de ${progress.total}…` : "Preparando o desenho…"}
                {progress && progress.failed.length > 0 && ` (${progress.failed.length} com falha)`}
              </Typography>
              <LinearProgress variant={progress ? "determinate" : "indeterminate"} value={progress ? (progress.done / Math.max(1, progress.total)) * 100 : 0} />
            </Box>
          )}
          {error && <Alert severity="warning">Não foi possível carregar as imagens agora. Atualize a página.</Alert>}
          {!drawing && missing.length > 0 && items.length > 0 && (
            <Button
              data-testid="content-studio-images-missing"
              startIcon={<AutoAwesome />}
              variant="contained"
              disabled={disabled}
              onClick={() => onRegenerate(undefined, undefined)}
              sx={{ minHeight: 48, fontWeight: 700, alignSelf: { sm: "flex-start" } }}
            >
              Gerar as {missing.length} que faltam
            </Button>
          )}
          <ImageCarousel items={items} ratio={ratio} drawing={drawing} disabled={disabled} onRedo={setTarget} />
        </Stack>
      )}

      {showPdf && tab === VisualsTab.PDF && (
        <StagePdfTab packageId={packageId} stageId={stageId} versionKey={pdfKey} hasUnsavedChanges={false} active fileBaseName={fileBaseName} />
      )}

      <Dialog open={Boolean(target)} onClose={close} fullWidth maxWidth="sm" data-testid="content-studio-image-redo-dialog">
        <DialogTitle>{target ? `Refazer “${target.title || target.slot}”` : "Refazer imagem"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Só esta imagem é refeita; as outras ficam como estão. Se quiser, diga o que mudar.
          </Typography>
          <TextField
            data-testid="content-studio-image-redo-instructions"
            fullWidth
            multiline
            minRows={2}
            label="O que mudar? (opcional)"
            placeholder="Ex.: deixe o leão menos assustador."
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            slotProps={{ htmlInput: { maxLength: VISUAL_INSTRUCTIONS_MAX } }}
            helperText={`${instructions.length}/${VISUAL_INSTRUCTIONS_MAX} caracteres`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={close} sx={{ minHeight: 48 }}>
            Cancelar
          </Button>
          <Button
            data-testid="content-studio-image-redo-confirm"
            variant="contained"
            sx={{ minHeight: 48, fontWeight: 700 }}
            onClick={() => {
              if (target) onRegenerate([target.slot], instructions.trim() || undefined);
              close();
            }}
          >
            Refazer
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
