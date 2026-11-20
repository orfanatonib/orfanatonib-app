import { CheckCircle } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";

import { CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import { exportFileName } from "../../export.utils";
import { REVIEW_STAGE_STATUS_COLORS, REVIEW_WORKSPACE_TEXTS } from "../../review-workspace.constants";
import { ContentStageStatus, ExportFormat, type ContentStageResponse, type ContentTrackResponse } from "../../types";
import { formatContentStudioDateTime } from "../../utils";
import { StagePdfTab } from "../StagePdfTab";

interface ReviewStagePanelProps {
  packageId: string;
  theme: string;
  track: ContentTrackResponse;
  stage: ContentStageResponse;
  versionChanged: boolean;
  onAcknowledge: () => void;
}

/** Conteúdo do item SÓ PARA LEITURA (o "Documento", que é o PDF), com o aviso de versão nova que o revisor precisa ver antes de decidir. */
export function ReviewStagePanel({ packageId, theme, track, stage, versionChanged, onAcknowledge }: ReviewStagePanelProps) {
  const version = stage.currentVersion;
  const fileBaseName = exportFileName([theme, track.audienceName, CONTENT_STAGE_TYPE_LABELS[stage.stageType]], ExportFormat.PDF).replace(
    /\.pdf$/,
    "",
  );

  return (
    <Paper
      elevation={0}
      data-testid="content-studio-review-stage-panel"
      sx={{ p: { xs: 1.5, sm: 3 }, minWidth: 0, borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 2 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="h2" fontWeight={800}>
            {stage.position}. {CONTENT_STAGE_TYPE_LABELS[stage.stageType]}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {track.audienceName}
            {version && (
              <>
                {" · "}
                <span data-testid="content-studio-review-version">
                  Versão {version.versionNumber} · criada em {formatContentStudioDateTime(version.createdAt)}
                </span>
              </>
            )}
          </Typography>
        </Box>
        {stage.status === ContentStageStatus.APPROVED ? (
          <Chip icon={<CheckCircle />} label={REVIEW_WORKSPACE_TEXTS.approved} color="success" sx={{ fontWeight: 800 }} />
        ) : stage.status !== ContentStageStatus.IN_REVIEW ? (
          // Esperando decisão é o normal (e a aba já mostra): o selo só entra aprovado ou devolvido.
          <Chip
            label={CONTENT_STAGE_STATUS_LABELS[stage.status]}
            color={REVIEW_STAGE_STATUS_COLORS[stage.status] ?? "default"}
            variant="outlined"
            sx={{ fontWeight: 800 }}
          />
        ) : null}
      </Stack>

      {versionChanged && (
        <Alert
          data-testid="content-studio-review-version-changed"
          severity="warning"
          sx={{ mb: 2, "& .MuiAlert-message": { width: "100%" } }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            {REVIEW_WORKSPACE_TEXTS.versionChanged}
          </Typography>
          <Button
            data-testid="content-studio-review-acknowledge"
            color="inherit"
            variant="outlined"
            onClick={onAcknowledge}
            sx={{ minHeight: 44 }}
          >
            {REVIEW_WORKSPACE_TEXTS.acknowledge}
          </Button>
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Na revisão só há o "Documento": o PDF real da versão (para fixação e brincadeira, já com a imagem compilada na
          última página; para os visuais, as imagens uma por página). Somente leitura: nada se edita aqui. */}
      <Typography variant="subtitle2" component="h3" fontWeight={800} sx={{ mb: 1 }} data-testid="content-studio-review-document-title">
        Documento
      </Typography>
      <StagePdfTab
        key={`${stage.id}:${stage.currentVersionId ?? ""}`}
        packageId={packageId}
        stageId={stage.id}
        versionKey={stage.currentVersionId}
        hasUnsavedChanges={false}
        active
        fileBaseName={fileBaseName}
        readOnly
      />
    </Paper>
  );
}
