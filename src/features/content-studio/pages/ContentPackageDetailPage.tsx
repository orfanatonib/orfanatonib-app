import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import { CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "../constants";
import { useStudioWorkspace } from "../hooks/useStudioWorkspace";
import { ContentStageStatus } from "../types";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { ContentStageNavigation } from "../components/ContentStageNavigation";
import { ContentStageEditor } from "../components/ContentStageEditor";
import { PackageSummaryCard } from "../components/detail/PackageSummaryCard";
import { StageActionsBar } from "../components/detail/StageActionsBar";
import { StageGenerationPanel } from "../components/detail/StageGenerationPanel";
import { StageReviewSection } from "../components/detail/StageReviewSection";
import { StageStatusAlerts } from "../components/detail/StageStatusAlerts";
import { exportFileName } from "../export.utils";
import { ExportFormat } from "../types";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";
import { MANUAL_EDIT_ALLOWED_STATUSES, PACKAGE_PRODUCTION_LOCKED_STATUSES } from "../workspace.constants";
import { stageDraftValue } from "../workspace.utils";

export function ContentPackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const workspace = useStudioWorkspace(id);
  const [documentDirty, setDocumentDirty] = useState(false);
  const { contentPackage, loading, error, reload, feedback, drafts, busyStageId, packageBusy } = workspace;
  const dirtyIds =
    contentPackage?.tracks
      .flatMap((track) => track.stages)
      .filter((stage) => drafts[stage.id] !== undefined && drafts[stage.id] !== stageDraftValue(stage))
      .map((stage) => stage.id) ?? [];
  const hasDrafts = dirtyIds.length > 0;
  useEffect(() => {
    if (!hasDrafts) return;
    const preventLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLeave);
    return () => window.removeEventListener("beforeunload", preventLeave);
  }, [hasDrafts]);
  const track = contentPackage?.tracks.find((item) => item.audience === params.get("audience")) ?? contentPackage?.tracks[0];
  const stage = track?.stages.find((item) => item.stageType === params.get("stage")) ?? track?.stages[0];
  const busy = busyStageId !== null || packageBusy;
  const locked = !!contentPackage && PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(contentPackage.status);
  const conflict = !!stage && workspace.conflictingDraftIds.includes(stage.id);
  const dirty = !!stage && dirtyIds.includes(stage.id);
  const dependenciesReady =
    !!stage &&
    stage.dependencies.every((dependency) =>
      track?.stages.some(
        (item) =>
          item.stageType === dependency &&
          [ContentStageStatus.DRAFT, ContentStageStatus.PRODUCER_APPROVED, ContentStageStatus.APPROVED].includes(item.status),
      ),
    );
  const allStages = contentPackage?.tracks.flatMap((item) => item.stages) ?? [];
  const completeCount = allStages.filter((item) =>
    [ContentStageStatus.PRODUCER_APPROVED, ContentStageStatus.APPROVED].includes(item.status),
  ).length;

  return (
    <Box component="section" data-testid="content-studio-package-detail-page" sx={CONTENT_STUDIO_PAGE_SX}>
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Material para visita"
          description="Gere, escreva e revise cada etapa; veja o PDF e baixe em DOCX."
          backTo="/adm/estudio/producao"
          backLabel="Voltar aos materiais"
        />
        {loading && !contentPackage && (
          <Stack data-testid="content-studio-detail-loading" alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        )}
        {error && (
          <Alert
            severity="error"
            data-testid="content-studio-detail-error"
            action={<Button onClick={() => void reload()}>Tentar novamente</Button>}
          >
            Não foi possível atualizar este material.
          </Alert>
        )}
        {feedback && (
          <Alert data-testid="content-studio-feedback" severity={feedback.severity} onClose={() => workspace.setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}
        {contentPackage && (
          <>
            <PackageSummaryCard
              contentPackage={contentPackage}
              track={track}
              workspace={workspace}
              busy={busy}
              completeCount={completeCount}
              totalStages={allStages.length}
              hasUnsavedWork={hasDrafts || documentDirty}
            />
            {hasDrafts && (
              <Alert severity="warning" data-testid="content-studio-unsaved-notice">
                Há alterações não salvas. Salve a etapa antes de concluir a produção.
              </Alert>
            )}
            {workspace.draftStorageFailed && (
              <Alert severity="warning">Não foi possível guardar o rascunho neste navegador. Salve antes de sair.</Alert>
            )}
            <Tabs
              value={track?.audience ?? false}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Categorias do material"
              data-testid="content-studio-audience-tabs"
              onChange={(_, audience: string) => {
                const next = new URLSearchParams(params);
                next.set("audience", audience);
                next.delete("stage");
                setParams(next);
              }}
            >
              {contentPackage.tracks.map((item) => (
                <Tab
                  key={item.id}
                  value={item.audience}
                  label={item.audienceName}
                  data-testid={`content-studio-audience-${item.audience}`}
                />
              ))}
            </Tabs>
            {track && stage ? (
              <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems="flex-start">
                <ContentStageNavigation
                  track={track}
                  selectedId={stage.id}
                  dirtyIds={dirtyIds}
                  onSelect={(stageId) => {
                    const next = new URLSearchParams(params);
                    const selected = track.stages.find((item) => item.id === stageId);
                    if (selected) next.set("stage", selected.stageType);
                    setParams(next);
                  }}
                />
                <Card variant="outlined" sx={{ flex: 1, minWidth: 0, width: "100%" }} data-testid="content-studio-active-stage">
                  <CardContent>
                    <Stack spacing={3}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography component="h2" variant="h5" fontWeight={800}>
                            {stage.position}. {CONTENT_STAGE_TYPE_LABELS[stage.stageType]}
                          </Typography>
                          <Typography color="text.secondary">
                            {track.audienceName} · {track.minimumAge}
                            {track.maximumAge === null ? "+ anos" : ` a ${track.maximumAge} anos`}
                            {stage.currentVersion && ` · Versão ${stage.currentVersion.versionNumber}`}
                          </Typography>
                        </Box>
                        <Chip label={CONTENT_STAGE_STATUS_LABELS[stage.status]} variant="outlined" />
                      </Stack>
                      <StageStatusAlerts
                        stage={stage}
                        workspace={workspace}
                        busy={busy}
                        locked={locked}
                        dependenciesReady={dependenciesReady}
                        conflict={conflict}
                      />
                      {workspace.generationEnabled && !locked && (
                        <StageGenerationPanel
                          stage={stage}
                          workspace={workspace}
                          busy={busy}
                          dirty={dirty}
                          dependenciesReady={dependenciesReady}
                        />
                      )}
                      <ContentStageEditor
                        key={stage.id}
                        stage={stage}
                        value={drafts[stage.id] ?? stageDraftValue(stage)}
                        disabled={locked || busy || !MANUAL_EDIT_ALLOWED_STATUSES.includes(stage.status)}
                        onChange={(value) => workspace.handleDraftChange(stage.id, value)}
                        packageId={contentPackage.id}
                        fileBaseName={exportFileName(
                          [contentPackage.theme, track.audienceName, CONTENT_STAGE_TYPE_LABELS[stage.stageType]],
                          ExportFormat.PDF,
                        ).replace(/\.pdf$/, "")}
                        onSaveDocument={workspace.handleSaveDocument}
                        onResetDocument={workspace.handleResetDocument}
                        onDocumentDirtyChange={setDocumentDirty}
                        fieldsDirty={dirty}
                      />
                      {!locked && <StageActionsBar stage={stage} workspace={workspace} busy={busy} dirty={dirty} conflict={conflict} />}
                      <StageReviewSection contentPackage={contentPackage} stage={stage} workspace={workspace} busy={busy} />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <Alert data-testid="content-studio-stage-empty" severity="info">
                Este material ainda não possui etapas.
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
