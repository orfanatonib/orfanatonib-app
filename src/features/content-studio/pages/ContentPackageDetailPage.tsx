import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import { CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "../constants";
import { useStudioWorkspace } from "../hooks/useStudioWorkspace";
import { ContentAudience, ContentStageStatus, ContentStageType, VisualOrientation } from "../types";
import { VisualConfigWizard } from "../components/visuals/VisualConfigWizard";
import { StageVisualsPanel } from "../components/visuals/StageVisualsPanel";
import { CATEGORY_BUSY_MESSAGE, CATEGORY_IN_REVIEW_MESSAGE, FUN_STAGE_TYPES, GENERATION_ALLOWED_STATUSES, IMAGE_ONLY_STAGE_TYPES, REVIEW_HELD_STAGE_STATUSES } from "../workspace.constants";
import { isCategoryBusy, isGenerationActive, isStageWorking } from "../generation.utils";
import { ContentStageNavigation } from "../components/ContentStageNavigation";
import { SendReviewDialog } from "../components/detail/SendReviewDialog";
import { ContentStageEditor } from "../components/ContentStageEditor";
import { PackageSummaryCard } from "../components/detail/PackageSummaryCard";
import { StageActionsBar } from "../components/detail/StageActionsBar";
import { StageActionsToolbar, StageGenerationPanel } from "../components/detail/StageGenerationPanel";
import { StageReviewSection } from "../components/detail/StageReviewSection";
import { StageStatusAlerts } from "../components/detail/StageStatusAlerts";
import { exportFileName } from "../export.utils";
import { ExportFormat } from "../types";
import { MANUAL_EDIT_ALLOWED_STATUSES, PACKAGE_PRODUCTION_LOCKED_STATUSES, STAGE_PRODUCTION_LOCKED_STATUSES } from "../workspace.constants";
import { SEND_REVIEW_TEXTS, TRACK_REVIEW_STATE_COLORS, TRACK_REVIEW_STATE_LABELS } from "../review.constants";
import { REVIEW_QUERY, reviewPackagePath } from "../review-workspace.constants";
import { TrackReviewState, nextProductionStage, submittableTracks, trackReviewState } from "../workspace.utils";
import { funImagesLayout, stageDraftValue } from "../workspace.utils";

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
  const navigate = useNavigate();
  /** Envio para a revisão pendente de confirmação: uma categoria (o normal) ou todas as prontas (só quando tudo está pronto). */
  const [sending, setSending] = useState<{ audiences: readonly ContentAudience[]; all: boolean } | null>(null);
  const sendingNames = (contentPackage?.tracks ?? [])
    .filter((item) => sending?.audiences.includes(item.audience))
    .map((item) => item.audienceName);
  const confirmSend = () => {
    const request = sending;
    setSending(null);
    if (!request) return;
    // Só acontece quando o usuário manda. Enviou: vai para a revisão, onde a categoria fica "Pendente de revisão".
    void workspace.handleSubmitReview(request.audiences).then((sent) => {
      if (!sent || !contentPackage) return;
      navigate(`${reviewPackagePath(contentPackage.id)}?${REVIEW_QUERY.audience}=${request.audiences[0]}`);
    });
  };
  /** Item concluído: abre o próximo item da categoria (sem gerar nada: o usuário decide quando gerar). */
  const goToNextItem = () => {
    const next = nextProductionStage(track, stage?.id);
    if (!next) return;
    const nextParams = new URLSearchParams(params);
    nextParams.set("stage", next.stageType);
    setParams(nextParams);
  };
  // Bloqueia o pacote encerrado e o item enviado para a revisão (em revisão ou já aprovado); as outras categorias seguem em produção.
  // Categoria já publicada em Materiais de Visita também fica travada: a página mostra a versão aprovada e publicada.
  const trackPublished = !!track?.publishedAt;
  const locked =
    (!!contentPackage && PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(contentPackage.status)) ||
    (!!stage && STAGE_PRODUCTION_LOCKED_STATUSES.includes(stage.status)) ||
    trackPublished;
  const conflict = !!stage && workspace.conflictingDraftIds.includes(stage.id);
  const dirty = !!stage && dirtyIds.includes(stage.id);
  const generatingNow = !!stage && isStageWorking(stage, workspace.generationJobs[stage.id], workspace.awaitingImages[stage.id] === true);
  // Categoria que já foi para a revisão: só o item devolvido pode ser gerado de novo (o concluído fica travado).
  const heldByReview =
    !!stage &&
    !!track &&
    stage.status === ContentStageStatus.PRODUCER_APPROVED &&
    track.stages.some((item) => REVIEW_HELD_STAGE_STATUSES.includes(item.status));
  const categoryBusy = heldByReview || (!!stage && !!track && isCategoryBusy(track.stages, stage.id, workspace.generationJobs));
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
              onSendAll={() => setSending({ audiences: submittableTracks(contentPackage.tracks).map((item) => item.audience), all: true })}
            />
            <SendReviewDialog
              open={sending !== null}
              names={sendingNames}
              all={sending?.all ?? false}
              busy={busy}
              onClose={() => setSending(null)}
              onConfirm={confirmSend}
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
                      {item.publishedAt ? (
                        <Chip
                          size="small"
                          color="success"
                          label="Publicada"
                          data-testid={`content-studio-track-published-${item.audience}`}
                        />
                      ) : (
                        trackReviewState(item) !== TrackReviewState.IN_PRODUCTION && (
                          <Chip
                            size="small"
                            color={TRACK_REVIEW_STATE_COLORS[trackReviewState(item)]}
                            label={TRACK_REVIEW_STATE_LABELS[trackReviewState(item)]}
                          />
                        )
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
                      {trackReviewState(track) === TrackReviewState.READY_TO_SUBMIT && (
                        <Alert
                          severity="info"
                          data-testid="content-studio-track-ready-notice"
                          action={
                            workspace.canSubmitReview && (
                              <Button
                                color="inherit"
                                variant="outlined"
                                size="small"
                                disabled={busy || hasDrafts || documentDirty}
                                onClick={() => setSending({ audiences: [track.audience], all: false })}
                                data-testid="content-studio-track-send-review"
                                sx={{ minHeight: 44, fontWeight: 700, whiteSpace: "nowrap" }}
                              >
                                {SEND_REVIEW_TEXTS.sendCategory}
                              </Button>
                            )
                          }
                        >
                          {SEND_REVIEW_TEXTS.categoryReadyNotice(track.audienceName)}
                        </Alert>
                      )}
                      {trackPublished && (
                        <Alert severity="success" data-testid="content-studio-track-published-notice">
                          Esta categoria já foi publicada em Materiais de Visita e não pode mais ser alterada.
                        </Alert>
                      )}
                      <StageStatusAlerts
                        stage={stage}
                        workspace={workspace}
                        busy={busy}
                        locked={locked}
                        dependenciesReady={dependenciesReady}
                        conflict={conflict}
                      />
                      {/* Enquanto o texto é gerado só o painel de progresso fica; o resto volta quando ele some. */}
                      {!generatingNow && (
                        <>
                          {!locked && !(stage.stageType !== ContentStageType.LESSON_VISUALS && workspace.generationEnabled) && (
                            <StageActionsToolbar>
                              <StageActionsBar
                                stage={stage}
                                workspace={workspace}
                                busy={busy}
                                dirty={dirty}
                                conflict={conflict}
                                onCompleted={goToNextItem}
                              />
                            </StageActionsToolbar>
                          )}
                          {categoryBusy && (
                            <Alert severity="info" data-testid="content-studio-category-busy">
                              {heldByReview ? CATEGORY_IN_REVIEW_MESSAGE : CATEGORY_BUSY_MESSAGE}
                            </Alert>
                          )}
                          {stage.stageType !== ContentStageType.LESSON_VISUALS && workspace.generationEnabled && !locked && (
                            <StageGenerationPanel
                              stage={stage}
                              workspace={workspace}
                              busy={busy}
                              dirty={dirty}
                              dependenciesReady={dependenciesReady}
                              categoryBusy={categoryBusy}
                              actions={
                                <StageActionsBar
                                  stage={stage}
                                  workspace={workspace}
                                  busy={busy}
                                  dirty={dirty}
                                  conflict={conflict}
                                  onCompleted={goToNextItem}
                                />
                              }
                            />
                          )}
                          {stage.stageType === ContentStageType.LESSON_VISUALS && workspace.generationEnabled && !locked && (
                            <VisualConfigWizard
                              audience={track.audience}
                              savedConfig={stage.currentVersion?.structuredContent?.visualConfig}
                              hasVersion={Boolean(stage.currentVersion)}
                              disabled={busy || categoryBusy || !dependenciesReady || !GENERATION_ALLOWED_STATUSES.includes(stage.status)}
                              generating={
                                stage.status === ContentStageStatus.GENERATING ||
                                isGenerationActive(workspace.generationJobs[stage.id] ?? null)
                              }
                              onGenerate={(config) => void workspace.handleRequestGeneration(stage, config)}
                            />
                          )}
                          {IMAGE_ONLY_STAGE_TYPES.includes(stage.stageType) && (
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
                              previewOnly={locked}
                              onRegenerate={(slots, instructions) =>
                                void workspace.handleRegenerateImages(stage, {
                                  slots,
                                  instructions,
                                })
                              }
                            />
                          )}
                          {!IMAGE_ONLY_STAGE_TYPES.includes(stage.stageType) && (
                            <ContentStageEditor
                              previewOnly={locked}
                              pdfVersionSuffix={FUN_STAGE_TYPES.includes(stage.stageType) ? `:${funImageKeys[stage.id] ?? ""}` : undefined}
                              documentFooter={
                                FUN_STAGE_TYPES.includes(stage.stageType) ? (
                                  <StageVisualsPanel
                                    packageId={contentPackage.id}
                                    stageId={stage.id}
                                    versionKey={stage.currentVersionId}
                                    orientation={funImagesLayout(stage.stageType, track.audience, stage.currentVersion?.structuredContent).orientation}
                                    job={workspace.generationJobs[stage.id] ?? null}
                                    disabled={locked || busy}
                                    fileBaseName=""
                                    showPdf={false}
                                    title={funImagesLayout(stage.stageType, track.audience, stage.currentVersion?.structuredContent).title}
                                    onFingerprint={(fingerprint) =>
                                      setFunImageKeys((current) =>
                                        current[stage.id] === fingerprint
                                          ? current
                                          : {
                                              ...current,
                                              [stage.id]: fingerprint,
                                            },
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
                          <StageReviewSection stage={stage} workspace={workspace} busy={busy} />
                        </>
                      )}
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
