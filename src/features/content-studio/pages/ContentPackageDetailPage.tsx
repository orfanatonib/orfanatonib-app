import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import { CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "../constants";
import { useStudioWorkspace } from "../hooks/useStudioWorkspace";
import { ContentAudience, ContentStageStatus, ContentStageType, VisualOrientation } from "../types";
import { VisualConfigWizard } from "../components/visuals/VisualConfigWizard";
import { StageVisualsPanel } from "../components/visuals/StageVisualsPanel";
import { GENERATION_ALLOWED_STATUSES } from "../workspace.constants";
import { isGenerationActive } from "../generation.utils";
import { ContentStageNavigation } from "../components/ContentStageNavigation";
import { ContentStageEditor } from "../components/ContentStageEditor";
import { PackageSummaryCard } from "../components/detail/PackageSummaryCard";
import { StageActionsBar } from "../components/detail/StageActionsBar";
import { StageGenerationPanel } from "../components/detail/StageGenerationPanel";
import { StageReviewSection } from "../components/detail/StageReviewSection";
import { StageStatusAlerts } from "../components/detail/StageStatusAlerts";
import { exportFileName } from "../export.utils";
import { ExportFormat } from "../types";
import { MANUAL_EDIT_ALLOWED_STATUSES, PACKAGE_PRODUCTION_LOCKED_STATUSES } from "../workspace.constants";
import { TRACK_REVIEW_STATE_COLORS, TRACK_REVIEW_STATE_LABELS } from "../review.constants";
import { TrackReviewState, trackReviewState } from "../workspace.utils";
import { stageDraftValue } from "../workspace.utils";

/** Etapas com documento E imagem compilada (infográfico): o documento e o PDF ficam no editor; a imagem, acima dele. */
const FUN_STAGE_TYPES: readonly ContentStageType[] = [ContentStageType.VERSE_FIXATION, ContentStageType.STANDARD_GAME];

/** Etapas que viram imagens (carrossel + PDF de imagens), sem documento de texto. */
const IMAGE_STAGE_TYPES: readonly ContentStageType[] = [ContentStageType.LESSON_VISUALS, ContentStageType.VERSE_VISUALS];

export function ContentPackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  /** Fingerprint das imagens de cada etapa de fixação/brincadeira: o PDF do editor é refeito quando ele muda. */
  const [funImageKeys, setFunImageKeys] = useState<Record<string, string>>({});
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
  // A URL sempre diz onde o usuário está (categoria e etapa), inclusive quando abriu sem parâmetros ou quando
  // o parâmetro era inválido: assim o link copiado ou recarregado volta exatamente para esta etapa.
  const audienceKey = track?.audience;
  const stageKey = stage?.stageType;
  useEffect(() => {
    if (!audienceKey || !stageKey) return;
    if (params.get("audience") === audienceKey && params.get("stage") === stageKey) return;
    const next = new URLSearchParams(params);
    next.set("audience", audienceKey);
    next.set("stage", stageKey);
    setParams(next, { replace: true });
  }, [audienceKey, stageKey, params, setParams]);
  const busy = busyStageId !== null || packageBusy;
  // Bloqueia o pacote encerrado e a etapa que já foi enviada para revisão; as outras categorias seguem em produção.
  const locked =
    (!!contentPackage && PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(contentPackage.status)) ||
    stage?.status === ContentStageStatus.IN_REVIEW;
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
    <Box component="section" data-testid="content-studio-package-detail-page">
      <Stack spacing={3}>
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
              variant="fullWidth"
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
                  sx={{
                    minWidth: 0,
                    px: { xs: 0.25, sm: 2 },
                    fontSize: { xs: "0.68rem", sm: "0.875rem" },
                    letterSpacing: { xs: 0, sm: "0.02857em" },
                  }}
                  label={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1 }} alignItems="center">
                      <span>{item.audienceName}</span>
                      {trackReviewState(item) !== TrackReviewState.IN_PRODUCTION && (
                        <Chip
                          size="small"
                          color={TRACK_REVIEW_STATE_COLORS[trackReviewState(item)]}
                          label={TRACK_REVIEW_STATE_LABELS[trackReviewState(item)]}
                        />
                      )}
                    </Stack>
                  }
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
                      {stage.stageType === ContentStageType.LESSON_VISUALS && workspace.generationEnabled && !locked && (
                        <VisualConfigWizard
                          audience={track.audience}
                          savedConfig={stage.currentVersion?.structuredContent?.visualConfig}
                          hasVersion={Boolean(stage.currentVersion)}
                          disabled={busy || !dependenciesReady || !GENERATION_ALLOWED_STATUSES.includes(stage.status)}
                          generating={
                            stage.status === ContentStageStatus.GENERATING || isGenerationActive(workspace.generationJobs[stage.id] ?? null)
                          }
                          onGenerate={(config) => void workspace.handleRequestGeneration(stage, config)}
                        />
                      )}
                      {IMAGE_STAGE_TYPES.includes(stage.stageType) && (
                        <StageVisualsPanel
                          packageId={contentPackage.id}
                          stageId={stage.id}
                          versionKey={stage.currentVersionId}
                          orientation={
                            (stage.currentVersion?.structuredContent?.visualConfig as { orientation?: VisualOrientation } | undefined)
                              ?.orientation
                          }
                          job={workspace.generationJobs[stage.id] ?? null}
                          disabled={locked || busy}
                          fileBaseName={exportFileName(
                            [contentPackage.theme, track.audienceName, CONTENT_STAGE_TYPE_LABELS[stage.stageType]],
                            ExportFormat.PDF,
                          ).replace(/\.pdf$/, "")}
                          onRegenerate={(slots, instructions) => void workspace.handleRegenerateImages(stage, { slots, instructions })}
                        />
                      )}
                      {stage.stageType !== ContentStageType.LESSON_VISUALS && workspace.generationEnabled && !locked && (
                        <StageGenerationPanel
                          stage={stage}
                          workspace={workspace}
                          busy={busy}
                          dirty={dirty}
                          dependenciesReady={dependenciesReady}
                        />
                      )}
                      {!IMAGE_STAGE_TYPES.includes(stage.stageType) && (
                        <ContentStageEditor
                          pdfVersionSuffix={FUN_STAGE_TYPES.includes(stage.stageType) ? `:${funImageKeys[stage.id] ?? ""}` : undefined}
                          documentFooter={
                            FUN_STAGE_TYPES.includes(stage.stageType) ? (
                              <StageVisualsPanel
                                packageId={contentPackage.id}
                                stageId={stage.id}
                                versionKey={stage.currentVersionId}
                                orientation={VisualOrientation.PORTRAIT}
                                job={workspace.generationJobs[stage.id] ?? null}
                                disabled={locked || busy}
                                fileBaseName=""
                                showPdf={false}
                                title={
                                  stage.stageType === ContentStageType.STANDARD_GAME && track.audience === ContentAudience.CHILD
                                    ? "Últimas páginas do documento: imagens compiladas, uma por faixa etária (A4 retrato)"
                                    : "Última página do documento: imagem compilada (A4 retrato)"
                                }
                                onFingerprint={(fingerprint) =>
                                  setFunImageKeys((current) =>
                                    current[stage.id] === fingerprint ? current : { ...current, [stage.id]: fingerprint },
                                  )
                                }
                                onRegenerate={(slots, instructions) =>
                                  void workspace.handleRegenerateImages(stage, { slots, instructions })
                                }
                              />
                            ) : undefined
                          }
                          key={stage.id}
                          stage={stage}
                          value={drafts[stage.id] ?? stageDraftValue(stage)}
                          disabled={locked || busy || !MANUAL_EDIT_ALLOWED_STATUSES.includes(stage.status)}
                          onChange={(value) => workspace.handleDraftChange(stage.id, value)}
                          packageId={contentPackage.id}
                          audienceName={track.audienceName}
                          fileBaseName={exportFileName(
                            [contentPackage.theme, track.audienceName, CONTENT_STAGE_TYPE_LABELS[stage.stageType]],
                            ExportFormat.PDF,
                          ).replace(/\.pdf$/, "")}
                          onSaveDocument={workspace.handleSaveDocument}
                          onResetDocument={workspace.handleResetDocument}
                          onDocumentDirtyChange={setDocumentDirty}
                          fieldsDirty={dirty}
                        />
                      )}
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
