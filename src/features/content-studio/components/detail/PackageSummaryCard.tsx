import { useState } from "react";
import { Archive, ImageOutlined, Refresh, TaskAlt } from "@mui/icons-material";
import { Badge, Box, Button, Card, CardContent, Chip, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";

import { CONTENT_PACKAGE_STATUS_LABELS } from "../../constants";
import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { PACKAGE_STATUS_COLORS } from "../../period.utils";
import type { ContentPackageResponse, ContentTrackResponse } from "../../types";
import { PackageExportMenu } from "../PackageExportMenu";
import { PackageCoverDialog } from "./PackageCoverDialog";
import { PACKAGE_COVER_TEXTS } from "../../cover.constants";
import { hasUnseenCover, markCoverSeen, readSeenCover } from "../../cover.utils";
import { SEND_REVIEW_TEXTS } from "../../review.constants";
import { canSendAllToReview } from "../../workspace.utils";

interface PackageSummaryCardProps {
  contentPackage: ContentPackageResponse;
  track: ContentTrackResponse | undefined;
  workspace: StudioWorkspace;
  busy: boolean;
  completeCount: number;
  totalStages: number;
  /** Há rascunho de campos ou de documento sem salvar: bloqueia o envio para revisão. */
  hasUnsavedWork: boolean;
  /** Abre a confirmação do envio geral (todas as categorias prontas). */
  onSendAll: () => void;
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
  onSendAll,
}: PackageSummaryCardProps) {
  const statusColor = PACKAGE_STATUS_COLORS[contentPackage.status];
  const [coverOpen, setCoverOpen] = useState(false);
  const [seenCover, setSeenCover] = useState(() => readSeenCover(contentPackage.id));
  const coverUnseen = hasUnseenCover(contentPackage.coverImageUrl, contentPackage.coverGenerating, seenCover);
  const openCover = () => {
    setCoverOpen(true);
    if (contentPackage.coverImageUrl) {
      markCoverSeen(contentPackage.id, contentPackage.coverImageUrl);
      setSeenCover(contentPackage.coverImageUrl);
    }
  };
  return (
    <Card variant="outlined" data-testid="content-studio-production-header">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography
                component="h2"
                variant="h4"
                fontWeight={800}
                sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" }, overflowWrap: "anywhere" }}
              >
                {contentPackage.theme}
              </Typography>
              <Typography color="text.secondary">{contentPackage.biblicalReferences}</Typography>
            </Box>
            <Chip
              label={CONTENT_PACKAGE_STATUS_LABELS[contentPackage.status]}
              color={statusColor}
              variant={statusColor === "default" ? "outlined" : "filled"}
              sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, flexShrink: 0 }}
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
            <Button
              data-testid="content-studio-cover-open"
              startIcon={contentPackage.coverGenerating ? <CircularProgress size={18} /> : <ImageOutlined />}
              onClick={openCover}
              sx={{ minHeight: 44 }}
            >
              <Badge
                color="error"
                variant="dot"
                invisible={!coverUnseen}
                data-testid="content-studio-cover-badge"
                aria-label={PACKAGE_COVER_TEXTS.newCoverAria}
                sx={{ "& .MuiBadge-badge": { right: -10, top: 2 } }}
              >
                {PACKAGE_COVER_TEXTS.openButton}
              </Badge>
            </Button>
            <PackageExportMenu packageId={contentPackage.id} theme={contentPackage.theme} track={track} disabled={busy} />
            {/* O envio normal é por categoria (botão dentro dela). O geral só aparece quando todos os itens de todas as categorias estão prontos. */}
            {workspace.canSubmitReview && canSendAllToReview(contentPackage.tracks) && (
              <Button
                data-testid="content-studio-submit-review"
                variant="contained"
                startIcon={<TaskAlt />}
                disabled={busy || hasUnsavedWork}
                onClick={onSendAll}
                sx={{ minHeight: 44 }}
              >
                {SEND_REVIEW_TEXTS.sendAll}
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
      <PackageCoverDialog
        open={coverOpen}
        onClose={() => setCoverOpen(false)}
        contentPackage={contentPackage}
        onChanged={workspace.reload}
      />
    </Card>
  );
}
