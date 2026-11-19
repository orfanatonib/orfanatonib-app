import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Archive,
  AutoAwesome,
  Refresh,
  Save,
  TaskAlt,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  CONTENT_PACKAGE_STATUS_LABELS,
  CONTENT_STAGE_STATUS_LABELS,
  CONTENT_STAGE_TYPE_LABELS,
} from "../constants";
import { useStudioWorkspace } from "../hooks/useStudioWorkspace";
import {
  ContentPackageStatus,
  ContentReviewCommentStatus,
  ContentReviewDecisionType,
  ContentStageStatus,
} from "../types";
import { formatContentStudioDateTime } from "../utils";
import { generationErrorMessage, generationStatusLabel } from "../generation.utils";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { ContentStageNavigation } from "../components/ContentStageNavigation";
import { ContentStageEditor } from "../components/ContentStageEditor";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";
import {
  GENERATION_ALLOWED_STATUSES,
  MANUAL_EDIT_ALLOWED_STATUSES,
  PACKAGE_PRODUCTION_LOCKED_STATUSES,
  REVISION_INSTRUCTIONS_MAX_LENGTH,
} from "../workspace.constants";
import { stageDraftValue } from "../workspace.utils";

export function ContentPackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const workspace = useStudioWorkspace(id);
  const {
    contentPackage,
    loading,
    error,
    reload,
    feedback,
    drafts,
    busyStageId,
    packageBusy,
  } = workspace;
  const dirtyIds =
    contentPackage?.tracks
      .flatMap((track) => track.stages)
      .filter(
        (stage) =>
          drafts[stage.id] !== undefined &&
          drafts[stage.id] !== stageDraftValue(stage),
      )
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
  const track =
    contentPackage?.tracks.find(
      (item) => item.audience === params.get("audience"),
    ) ?? contentPackage?.tracks[0];
  const stage =
    track?.stages.find((item) => item.stageType === params.get("stage")) ??
    track?.stages[0];
  const busy = busyStageId !== null || packageBusy;
  const locked =
    !!contentPackage &&
    PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(contentPackage.status);
  const conflict = !!stage && workspace.conflictingDraftIds.includes(stage.id);
  const dirty = !!stage && dirtyIds.includes(stage.id);
  const dependenciesReady =
    !!stage &&
    stage.dependencies.every((dependency) =>
      track?.stages.some(
        (item) =>
          item.stageType === dependency &&
          [
            ContentStageStatus.DRAFT,
            ContentStageStatus.PRODUCER_APPROVED,
            ContentStageStatus.APPROVED,
          ].includes(item.status),
      ),
    );
  const allStages = contentPackage?.tracks.flatMap((item) => item.stages) ?? [];
  const completeCount = allStages.filter((item) =>
    [
      ContentStageStatus.PRODUCER_APPROVED,
      ContentStageStatus.APPROVED,
    ].includes(item.status),
  ).length;

  return (
    <Box
      component="section"
      data-testid="content-studio-package-detail-page"
      sx={CONTENT_STUDIO_PAGE_SX}
    >
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Estúdio Orfanato"
          description="Produza, confira e revise cada etapa do material."
          backTo="/adm/estudio/producao"
          backLabel="Voltar à produção"
        />
        {loading && !contentPackage && (
          <Stack
            data-testid="content-studio-detail-loading"
            alignItems="center"
            py={6}
          >
            <CircularProgress />
          </Stack>
        )}
        {error && (
          <Alert
            severity="error"
            data-testid="content-studio-detail-error"
            action={
              <Button onClick={() => void reload()}>Tentar novamente</Button>
            }
          >
            Não foi possível atualizar este material.
          </Alert>
        )}
        {feedback && (
          <Alert
            data-testid="content-studio-feedback"
            severity={feedback.severity}
            onClose={() => workspace.setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}
        {contentPackage && (
          <>
            <Card
              variant="outlined"
              data-testid="content-studio-production-header"
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography component="h1" variant="h4" fontWeight={800}>
                        {contentPackage.theme}
                      </Typography>
                      <Typography color="text.secondary">
                        {contentPackage.biblicalReferences}
                      </Typography>
                    </Box>
                    <Chip
                      label={
                        CONTENT_PACKAGE_STATUS_LABELS[contentPackage.status]
                      }
                    />
                  </Stack>
                  <Typography>{contentPackage.canonicalObjective}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {completeCount} de {allStages.length} etapas concluídas
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      allStages.length
                        ? (completeCount / allStages.length) * 100
                        : 0
                    }
                    aria-label="Progresso do material"
                    sx={{ height: 8, borderRadius: 2 }}
                  />
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <Button
                      startIcon={<Refresh />}
                      disabled={busy}
                      onClick={() => void reload()}
                      sx={{ minHeight: 44 }}
                    >
                      Atualizar
                    </Button>
                    {workspace.canSubmitReview && (
                      <Button
                        data-testid="content-studio-submit-review"
                        variant="contained"
                        startIcon={<TaskAlt />}
                        disabled={busy || hasDrafts}
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
            {hasDrafts && (
              <Alert
                severity="warning"
                data-testid="content-studio-unsaved-notice"
              >
                Há alterações não salvas. Salve a etapa antes de concluir a
                produção.
              </Alert>
            )}
            {workspace.draftStorageFailed && (
              <Alert severity="warning">
                Não foi possível guardar o rascunho neste navegador. Salve antes
                de sair.
              </Alert>
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
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={3}
                alignItems="flex-start"
              >
                <ContentStageNavigation
                  track={track}
                  selectedId={stage.id}
                  dirtyIds={dirtyIds}
                  onSelect={(stageId) => {
                    const next = new URLSearchParams(params);
                    const selected = track.stages.find(
                      (item) => item.id === stageId,
                    );
                    if (selected) next.set("stage", selected.stageType);
                    setParams(next);
                  }}
                />
                <Card
                  variant="outlined"
                  sx={{ flex: 1, minWidth: 0, width: "100%" }}
                  data-testid="content-studio-active-stage"
                >
                  <CardContent>
                    <Stack spacing={3}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography
                            component="h2"
                            variant="h5"
                            fontWeight={800}
                          >
                            {stage.position}.{" "}
                            {CONTENT_STAGE_TYPE_LABELS[stage.stageType]}
                          </Typography>
                          <Typography color="text.secondary">
                            {track.audienceName} · {track.minimumAge}
                            {track.maximumAge === null
                              ? "+ anos"
                              : ` a ${track.maximumAge} anos`}
                            {stage.currentVersion &&
                              ` · Versão ${stage.currentVersion.versionNumber}`}
                          </Typography>
                        </Box>
                        <Chip
                          label={CONTENT_STAGE_STATUS_LABELS[stage.status]}
                          variant="outlined"
                        />
                      </Stack>
                      {stage.status === ContentStageStatus.GENERATING && (
                        <Alert
                          icon={<CircularProgress size={20} />}
                          data-testid="content-studio-generation-progress"
                          action={
                            workspace.generationEnabled && !locked ? (
                              <Button
                                disabled={busy}
                                onClick={() =>
                                  void workspace.handleCancelGeneration(stage)
                                }
                                sx={{ minHeight: 44 }}
                              >
                                Cancelar geração
                              </Button>
                            ) : undefined
                          }
                        >
                          {workspace.generationJobs[stage.id]
                            ? generationStatusLabel(workspace.generationJobs[stage.id].status)
                            : "Gerando conteúdo."}{" "}
                          Você pode acompanhar outras etapas enquanto aguarda.
                          {workspace.generationJobs[stage.id]?.attempts > 1 &&
                            ` (tentativa ${workspace.generationJobs[stage.id].attempts})`}
                        </Alert>
                      )}
                      {stage.status === ContentStageStatus.STALE && (
                        <Alert severity="warning">
                          Uma etapa anterior mudou. Confira e atualize este
                          conteúdo antes de concluir.
                        </Alert>
                      )}
                      {stage.status === ContentStageStatus.FAILED && (
                        <Alert severity="error" data-testid="content-studio-generation-error">
                          {generationErrorMessage(workspace.generationJobs[stage.id] ?? null)}{" "}
                          Tente novamente ou edite o conteúdo manualmente.
                        </Alert>
                      )}
                      {!dependenciesReady && stage.dependencies.length > 0 && (
                        <Alert severity="info">
                          Prepare primeiro:{" "}
                          {stage.dependencies
                            .map(
                              (dependency) =>
                                CONTENT_STAGE_TYPE_LABELS[dependency],
                            )
                            .join(", ")}
                          .
                        </Alert>
                      )}
                      {workspace.generationEnabled && !locked && (
                        <Stack spacing={1}>
                          <TextField
                            label="Instruções para esta geração"
                            placeholder="Ex.: use exemplos do cotidiano e linguagem adequada ao público."
                            value={workspace.instructions[stage.id] ?? ""}
                            disabled={
                              busy ||
                              stage.status === ContentStageStatus.GENERATING
                            }
                            onChange={(event) =>
                              workspace.setInstructions((current) => ({
                                ...current,
                                [stage.id]: event.target.value,
                              }))
                            }
                            multiline
                            minRows={2}
                            inputProps={{
                              maxLength: REVISION_INSTRUCTIONS_MAX_LENGTH,
                              "data-testid":
                                "content-studio-generation-instructions",
                            }}
                          />
                          <Button
                            data-testid="content-studio-generate-stage"
                            variant="contained"
                            startIcon={<AutoAwesome />}
                            disabled={
                              busy ||
                              dirty ||
                              !dependenciesReady ||
                              !GENERATION_ALLOWED_STATUSES.includes(
                                stage.status,
                              )
                            }
                            onClick={() =>
                              void workspace.handleRequestGeneration(stage)
                            }
                            sx={{ alignSelf: "flex-start", minHeight: 44 }}
                          >
                            {stage.currentVersion
                              ? "Gerar novamente"
                              : "Gerar conteúdo"}
                          </Button>
                        </Stack>
                      )}
                      {conflict && (
                        <Alert
                          severity="warning"
                          data-testid="content-studio-version-conflict"
                        >
                          Existe uma versão mais recente no servidor. Seu
                          rascunho foi preservado. Copie o que deseja manter e
                          descarte as alterações para carregar a versão atual
                          antes de editar novamente.
                        </Alert>
                      )}
                      <ContentStageEditor
                        key={stage.id}
                        stage={stage}
                        value={drafts[stage.id] ?? stageDraftValue(stage)}
                        disabled={
                          locked ||
                          busy ||
                          !MANUAL_EDIT_ALLOWED_STATUSES.includes(stage.status)
                        }
                        onChange={(value) =>
                          workspace.handleDraftChange(stage.id, value)
                        }
                      />
                      {!locked && (
                        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                          <Button
                            data-testid="content-studio-save-stage"
                            variant="outlined"
                            startIcon={<Save />}
                            disabled={
                              busy ||
                              conflict ||
                              !dirty ||
                              !MANUAL_EDIT_ALLOWED_STATUSES.includes(
                                stage.status,
                              )
                            }
                            onClick={() =>
                              void workspace.handleSaveContent(stage)
                            }
                            sx={{ minHeight: 44 }}
                          >
                            Salvar versão
                          </Button>
                          {dirty && (
                            <Button
                              data-testid="content-studio-discard-stage"
                              color="inherit"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Descartar as alterações não salvas desta etapa?",
                                  )
                                )
                                  workspace.handleDraftChange(
                                    stage.id,
                                    stageDraftValue(stage),
                                  );
                              }}
                              sx={{ minHeight: 44 }}
                            >
                              Descartar alterações
                            </Button>
                          )}
                          <Button
                            data-testid="content-studio-complete-stage"
                            variant="contained"
                            startIcon={<TaskAlt />}
                            disabled={
                              busy ||
                              dirty ||
                              !stage.currentVersionId ||
                              stage.status !== ContentStageStatus.DRAFT
                            }
                            onClick={() =>
                              void workspace.handleCompleteProduction(stage)
                            }
                            sx={{ minHeight: 44 }}
                          >
                            Concluir produção
                          </Button>
                        </Stack>
                      )}
                      {workspace.reviewEnabled &&
                        [
                          ContentPackageStatus.IN_REVIEW,
                          ContentPackageStatus.CHANGES_REQUESTED,
                        ].includes(contentPackage.status) &&
                        stage.status === ContentStageStatus.IN_REVIEW && (
                          <Stack
                            spacing={2}
                            data-testid="content-studio-review-actions"
                          >
                            <TextField
                              label="Comentário para ajustes"
                              multiline
                              minRows={2}
                              value={workspace.changeMessages[stage.id] ?? ""}
                              onChange={(event) =>
                                workspace.handleChangeMessage(
                                  stage.id,
                                  event.target.value,
                                )
                              }
                            />
                            <Stack direction="row" gap={1} flexWrap="wrap">
                              <Button
                                variant="contained"
                                disabled={busy}
                                onClick={() =>
                                  void workspace.handleApproveStage(stage)
                                }
                                sx={{ minHeight: 44 }}
                              >
                                Aprovar etapa
                              </Button>
                              <Button
                                variant="outlined"
                                disabled={busy}
                                onClick={() =>
                                  void workspace.handleRequestChanges(stage)
                                }
                                sx={{ minHeight: 44 }}
                              >
                                Solicitar ajustes
                              </Button>
                            </Stack>
                          </Stack>
                        )}
                      {stage.reviewComments.length > 0 && (
                        <Stack
                          spacing={0.75}
                          mt={1}
                          data-testid={`content-studio-stage-comments-${stage.id}`}
                        >
                          {stage.reviewComments.map((comment) => (
                            <Alert
                              key={comment.id}
                              severity={
                                comment.status ===
                                ContentReviewCommentStatus.OPEN
                                  ? "warning"
                                  : "success"
                              }
                              data-testid={`content-studio-stage-comment-${comment.id}`}
                              action={
                                comment.status ===
                                ContentReviewCommentStatus.OPEN ? (
                                  <Button
                                    color="inherit"
                                    size="small"
                                    disabled={busy}
                                    onClick={() =>
                                      void workspace.resolveComment(
                                        comment.id,
                                        stage.id,
                                      )
                                    }
                                    data-testid={`content-studio-resolve-comment-${comment.id}`}
                                  >
                                    Resolver
                                  </Button>
                                ) : null
                              }
                            >
                              {comment.message}
                              <Typography
                                component="div"
                                variant="caption"
                                mt={0.5}
                              >
                                Versão{" "}
                                {stage.currentVersion?.id === comment.versionId
                                  ? stage.currentVersion.versionNumber
                                  : comment.versionId}
                                {" · "}
                                {formatContentStudioDateTime(comment.createdAt)}
                              </Typography>
                            </Alert>
                          ))}
                        </Stack>
                      )}
                      {stage.reviewDecisions.length > 0 && (
                        <Stack
                          spacing={0.5}
                          mt={1}
                          data-testid={`content-studio-stage-review-history-${stage.id}`}
                        >
                          <Typography variant="caption" fontWeight={700}>
                            Histórico de decisões
                          </Typography>
                          {stage.reviewDecisions.map((decision) => (
                            <Typography
                              key={decision.id}
                              variant="caption"
                              color="text.secondary"
                            >
                              {decision.decision ===
                              ContentReviewDecisionType.APPROVED
                                ? "Aprovada"
                                : "Ajustes solicitados"}{" "}
                              · versão{" "}
                              {decision.versionNumber ?? decision.versionId} ·{" "}
                              {formatContentStudioDateTime(decision.decidedAt)}
                            </Typography>
                          ))}
                        </Stack>
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
