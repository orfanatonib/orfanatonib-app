import { Archive, Refresh, TaskAlt } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";

import { CONTENT_PACKAGE_STATUS_LABELS } from "../../constants";
import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { PACKAGE_STATUS_COLORS } from "../../period.utils";
import type { ContentPackageResponse, ContentTrackResponse } from "../../types";
import { PackageExportMenu } from "../PackageExportMenu";

interface PackageSummaryCardProps {
  contentPackage: ContentPackageResponse;
  track: ContentTrackResponse | undefined;
  workspace: StudioWorkspace;
  busy: boolean;
  completeCount: number;
  totalStages: number;
  /** Há rascunho de campos ou de documento sem salvar: bloqueia o envio para revisão. */
  hasUnsavedWork: boolean;
}

/** Cabeçalho do material: tema, status, progresso e ações do pacote (atualizar, exportar, revisão, arquivar). */
export function PackageSummaryCard({
  contentPackage,
  track,
  workspace,
  busy,
  completeCount,
  totalStages,
  hasUnsavedWork,
}: PackageSummaryCardProps) {
  const statusColor = PACKAGE_STATUS_COLORS[contentPackage.status];
  return (
    <Card variant="outlined" data-testid="content-studio-production-header">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography component="h2" variant="h4" fontWeight={800}>
                {contentPackage.theme}
              </Typography>
              <Typography color="text.secondary">{contentPackage.biblicalReferences}</Typography>
            </Box>
            <Chip
              label={CONTENT_PACKAGE_STATUS_LABELS[contentPackage.status]}
              color={statusColor}
              variant={statusColor === "default" ? "outlined" : "filled"}
            />
          </Stack>
          <Typography>{contentPackage.canonicalObjective}</Typography>
          <Typography variant="body2" color="text.secondary">
            {completeCount} de {totalStages} etapas concluídas
          </Typography>
          <LinearProgress
            variant="determinate"
            value={totalStages ? (completeCount / totalStages) * 100 : 0}
            aria-label="Progresso do material"
            sx={{ height: 8, borderRadius: 2 }}
          />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button startIcon={<Refresh />} disabled={busy} onClick={() => void workspace.reload()} sx={{ minHeight: 44 }}>
              Atualizar
            </Button>
            <PackageExportMenu packageId={contentPackage.id} theme={contentPackage.theme} track={track} disabled={busy} />
            {workspace.canSubmitReview && (
              <Button
                data-testid="content-studio-submit-review"
                variant="contained"
                startIcon={<TaskAlt />}
                disabled={busy || hasUnsavedWork}
                onClick={() => void workspace.handleSubmitReview()}
                sx={{ minHeight: 44 }}
              >
                Enviar para revisão
              </Button>
            )}
            {workspace.canArchive && (
              <Button
                startIcon={<Archive />}
                disabled={busy}
                color="inherit"
                onClick={() => void workspace.handleArchive()}
                sx={{ minHeight: 44 }}
              >
                Arquivar material
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
