import Archive from "@mui/icons-material/Archive";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Refresh from "@mui/icons-material/Refresh";
import Save from "@mui/icons-material/Save";
import TaskAlt from "@mui/icons-material/TaskAlt";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  approveReviewStage,
  archiveContentPackage,
  completeProductionStage,
  requestStageGeneration,
  requestStageChanges,
  resolveReviewComment,
  saveStageContent,
  submitPackageReview,
} from "../api";
import {
  CONTENT_PACKAGE_STATUS_LABELS,
  CONTENT_STAGE_STATUS_LABELS,
  CONTENT_STAGE_TYPE_LABELS,
} from "../constants";
import { useContentPackage } from "../hooks/useContentPackage";
import { FeatureFlagKeys, useIsFeatureEnabled } from "@/features/feature-flags";
import {
  AiGenerationCapability,
  ContentPackageStatus,
  ContentReviewCommentStatus,
  ContentReviewDecisionType,
  ContentStageStatus,
  ContentStageType,
  type ContentStageResponse,
} from "../types";
import { formatContentStudioDateTime } from "../utils";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";

type FeedbackState = {
  readonly severity: "success" | "error";
  readonly message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function capabilityForStage(
  stage: ContentStageResponse,
): AiGenerationCapability {
  if (stage.stageType === ContentStageType.VISUAL) {
    return AiGenerationCapability.IMAGE_GENERATION;
  }

  return AiGenerationCapability.TEXT_STRUCTURED;
}

function stageDraftValue(stage: ContentStageResponse): string {
  const content = stage.currentVersion?.structuredContent ?? {
    stageType: stage.stageType,
    blocks: [{ type: "paragraph", text: "" }],
  };

  return JSON.stringify(content, null, 2);
}

const GENERATION_ALLOWED_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.NOT_STARTED,
  ContentStageStatus.DRAFT,
  ContentStageStatus.FAILED,
  ContentStageStatus.STALE,
  ContentStageStatus.CHANGES_REQUESTED,
];

const MANUAL_EDIT_ALLOWED_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.NOT_STARTED,
  ContentStageStatus.GENERATING,
  ContentStageStatus.DRAFT,
  ContentStageStatus.PRODUCER_APPROVED,
  ContentStageStatus.FAILED,
  ContentStageStatus.STALE,
  ContentStageStatus.CHANGES_REQUESTED,
  ContentStageStatus.APPROVED,
];

const PACKAGE_PRODUCTION_LOCKED_STATUSES: readonly ContentPackageStatus[] = [
  ContentPackageStatus.IN_REVIEW,
  ContentPackageStatus.PUBLISHING,
  ContentPackageStatus.PUBLISHED,
  ContentPackageStatus.ARCHIVED,
];

export function ContentPackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { contentPackage, loading, error, reload } = useContentPackage(id);
  const reviewEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO_REVIEW,
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [changeMessages, setChangeMessages] = useState<Record<string, string>>(
    {},
  );
  const [busyStageId, setBusyStageId] = useState<string | null>(null);
  const [packageBusy, setPackageBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const generationKeys = useRef<Record<string, string>>({});
  const knownVersionIds = useRef<Record<string, string | null>>({});
  const generationEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO_GENERATION,
  );

  useEffect(() => {
    if (!contentPackage) return;

    const stages = contentPackage.tracks.flatMap((track) => track.stages);
    setDrafts((current) => {
      const next = { ...current };
      for (const stage of stages) {
        if (
          !(stage.id in next) ||
          knownVersionIds.current[stage.id] !== stage.currentVersionId
        ) {
          next[stage.id] = stageDraftValue(stage);
        }
        knownVersionIds.current[stage.id] = stage.currentVersionId;
      }
      return next;
    });
  }, [contentPackage]);

  const handleDraftChange = (stageId: string, value: string) => {
    setDrafts((current) => ({ ...current, [stageId]: value }));
  };

  const handleChangeMessage = (stageId: string, value: string) => {
    setChangeMessages((current) => ({ ...current, [stageId]: value }));
  };

  const handleSubmitReview = async () => {
    if (!contentPackage) return;

    setFeedback(null);
    setPackageBusy(true);
    try {
      await submitPackageReview(contentPackage.id);
      setFeedback({
        severity: "success",
        message: "Pacote enviado para revisão.",
      });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível enviar o pacote para revisão.",
      });
    } finally {
      setPackageBusy(false);
    }
  };

  const handleRequestGeneration = async (stage: ContentStageResponse) => {
    if (!contentPackage) return;

    setFeedback(null);
    setBusyStageId(stage.id);
    try {
      const idempotencyKey =
        generationKeys.current[stage.id] ?? crypto.randomUUID();
      generationKeys.current[stage.id] = idempotencyKey;
      await requestStageGeneration(contentPackage.id, stage.id, {
        capability: capabilityForStage(stage),
        idempotencyKey,
      });
      setFeedback({
        severity: "success",
        message: "Job de geração registrado.",
      });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível solicitar geração para esta etapa.",
      });
    } finally {
      setBusyStageId(null);
    }
  };

  const handleSaveContent = async (stage: ContentStageResponse) => {
    if (!contentPackage) return;

    setFeedback(null);
    setBusyStageId(stage.id);
    try {
      const parsed = JSON.parse(drafts[stage.id] ?? "{}") as unknown;
      if (!isRecord(parsed)) {
        setFeedback({
          severity: "error",
          message: "O conteúdo estruturado precisa ser um objeto JSON.",
        });
        return;
      }

      await saveStageContent(contentPackage.id, stage.id, {
        structuredContent: parsed,
        templateVersion: contentPackage.templateCatalogVersion,
      });
      delete generationKeys.current[stage.id];
      setFeedback({ severity: "success", message: "Nova versão salva." });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível salvar o JSON desta etapa.",
      });
    } finally {
      setBusyStageId(null);
    }
  };

  const handleCompleteProduction = async (stage: ContentStageResponse) => {
    if (!contentPackage) return;

    setFeedback(null);
    setBusyStageId(stage.id);
    try {
      await completeProductionStage(contentPackage.id, stage.id);
      setFeedback({
        severity: "success",
        message: "Etapa concluída para revisão.",
      });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível concluir esta etapa.",
      });
    } finally {
      setBusyStageId(null);
    }
  };

  const handleApproveStage = async (stage: ContentStageResponse) => {
    if (!contentPackage) return;

    setFeedback(null);
    setBusyStageId(stage.id);
    try {
      if (!stage.currentVersionId || !stage.currentVersion) {
        setFeedback({
          severity: "error",
          message: "A etapa não possui versão atual para aprovar.",
        });
        return;
      }
      await approveReviewStage(contentPackage.id, stage.id, {
        versionId: stage.currentVersionId,
        lockVersion: stage.lockVersion,
        contentChecksum: stage.currentVersion.contentChecksum,
      });
      setFeedback({ severity: "success", message: "Etapa aprovada." });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível aprovar esta etapa.",
      });
    } finally {
      setBusyStageId(null);
    }
  };

  const handleRequestChanges = async (stage: ContentStageResponse) => {
    if (!contentPackage) return;

    const message = changeMessages[stage.id]?.trim();
    if (!message) {
      setFeedback({
        severity: "error",
        message: "Informe o comentário de ajuste antes de solicitar mudanças.",
      });
      return;
    }

    setFeedback(null);
    setBusyStageId(stage.id);
    try {
      if (!stage.currentVersionId || !stage.currentVersion) {
        setFeedback({
          severity: "error",
          message: "A etapa não possui versão atual para solicitar ajustes.",
        });
        return;
      }
      await requestStageChanges(contentPackage.id, stage.id, {
        versionId: stage.currentVersionId,
        lockVersion: stage.lockVersion,
        contentChecksum: stage.currentVersion.contentChecksum,
        message,
      });
      setFeedback({ severity: "success", message: "Ajustes solicitados." });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível solicitar ajustes nesta etapa.",
      });
    } finally {
      setBusyStageId(null);
    }
  };

  const canSubmitReview =
    reviewEnabled &&
    contentPackage !== null &&
    [
      ContentPackageStatus.PACKAGE_READY,
      ContentPackageStatus.CHANGES_REQUESTED,
    ].includes(contentPackage.status);

  const canArchive =
    contentPackage !== null &&
    contentPackage.tracks.some((track) =>
      track.stages.some((stage) => stage.currentVersionId !== null),
    ) &&
    ![ContentPackageStatus.PUBLISHING, ContentPackageStatus.ARCHIVED].includes(
      contentPackage.status,
    );

  const handleArchive = async () => {
    if (!contentPackage) return;

    const confirmed = window.confirm(
      "Tem certeza de que deseja arquivar este pacote? Esta ação não pode ser desfeita facilmente.",
    );
    if (!confirmed) return;

    setFeedback(null);
    setPackageBusy(true);
    try {
      await archiveContentPackage(contentPackage.id);
      setFeedback({
        severity: "success",
        message: "Pacote arquivado com sucesso.",
      });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível arquivar o pacote.",
      });
    } finally {
      setPackageBusy(false);
    }
  };

  return (
    <Box
      component="section"
      data-testid="content-studio-package-detail-page"
      sx={CONTENT_STUDIO_PAGE_SX}
    >
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Detalhe do pacote"
          description="Acompanhe versões, etapas por faixa etária e decisões editoriais."
          backTo="/adm/estudio/producao"
          backLabel="Voltar à produção"
        />

        {loading && (
          <Stack
            alignItems="center"
            justifyContent="center"
            minHeight={240}
            spacing={2}
          >
            <CircularProgress />
            <Typography color="text.secondary">Carregando pacote…</Typography>
          </Stack>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={() => void reload()}
                sx={{ minHeight: 44 }}
              >
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar este pacote.
          </Alert>
        )}

        {!loading && contentPackage && (
          <>
            {feedback && (
              <Alert
                severity={feedback.severity}
                onClose={() => setFeedback(null)}
              >
                {feedback.message}
              </Alert>
            )}

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Typography component="h2" variant="h5" fontWeight={700}>
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
                  <Divider />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Catálogo
                      </Typography>
                      <Typography>
                        {contentPackage.templateCatalogVersion}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Criado em
                      </Typography>
                      <Typography>
                        {formatContentStudioDateTime(contentPackage.createdAt)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Atualizado em
                      </Typography>
                      <Typography>
                        {formatContentStudioDateTime(contentPackage.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Objetivo canônico
                    </Typography>
                    <Typography>{contentPackage.canonicalObjective}</Typography>
                  </Box>
                  {contentPackage.canonicalNotes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Notas canônicas
                      </Typography>
                      <Typography>{contentPackage.canonicalNotes}</Typography>
                    </Box>
                  )}
                  <Button
                    onClick={() => void reload()}
                    startIcon={<Refresh />}
                    sx={{ alignSelf: "flex-start", minHeight: 44 }}
                  >
                    Atualizar
                  </Button>
                  {canArchive && (
                    <Button
                      onClick={() => void handleArchive()}
                      disabled={packageBusy}
                      startIcon={<Archive />}
                      color="inherit"
                      sx={{ alignSelf: "flex-start", minHeight: 44 }}
                    >
                      Arquivar pacote
                    </Button>
                  )}
                  {canSubmitReview && (
                    <Button
                      onClick={() => void handleSubmitReview()}
                      disabled={packageBusy}
                      startIcon={<TaskAlt />}
                      sx={{ alignSelf: "flex-start", minHeight: 44 }}
                      variant="contained"
                    >
                      Enviar para revisão
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              {contentPackage.tracks.map((track) => (
                <Card key={track.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography
                          component="h2"
                          variant="h6"
                          fontWeight={700}
                        >
                          {track.audienceName}
                        </Typography>
                        <Typography color="text.secondary">
                          {track.minimumAge}
                          {track.maximumAge === null
                            ? "+ anos"
                            : ` a ${track.maximumAge} anos`}
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        {track.stages.map((stage) => (
                          <Box key={stage.id}>
                            <Stack spacing={1.5}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                spacing={1}
                              >
                                <Box>
                                  <Typography fontWeight={700}>
                                    {stage.position}.{" "}
                                    {CONTENT_STAGE_TYPE_LABELS[stage.stageType]}
                                  </Typography>
                                  <Typography
                                    color="text.secondary"
                                    variant="body2"
                                  >
                                    Dependências:{" "}
                                    {stage.dependencies.length === 0
                                      ? "nenhuma"
                                      : stage.dependencies
                                          .map(
                                            (dependency) =>
                                              CONTENT_STAGE_TYPE_LABELS[
                                                dependency
                                              ],
                                          )
                                          .join(", ")}
                                  </Typography>
                                  {stage.currentVersion && (
                                    <Typography
                                      color="text.secondary"
                                      variant="body2"
                                    >
                                      Versão atual{" "}
                                      {stage.currentVersion.versionNumber}.
                                    </Typography>
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
                                                disabled={
                                                  busyStageId === stage.id
                                                }
                                                onClick={async () => {
                                                  setFeedback(null);
                                                  setBusyStageId(stage.id);
                                                  try {
                                                    await resolveReviewComment(
                                                      contentPackage.id,
                                                      comment.id,
                                                    );
                                                    setFeedback({
                                                      severity: "success",
                                                      message:
                                                        "Comentário resolvido.",
                                                    });
                                                    await reload();
                                                  } catch {
                                                    setFeedback({
                                                      severity: "error",
                                                      message:
                                                        "Não foi possível resolver o comentário.",
                                                    });
                                                  } finally {
                                                    setBusyStageId(null);
                                                  }
                                                }}
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
                                            {stage.currentVersion?.id ===
                                            comment.versionId
                                              ? stage.currentVersion
                                                  .versionNumber
                                              : comment.versionId}
                                            {" · "}
                                            {formatContentStudioDateTime(
                                              comment.createdAt,
                                            )}
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
                                      <Typography
                                        variant="caption"
                                        fontWeight={700}
                                      >
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
                                          {decision.versionNumber ??
                                            decision.versionId}{" "}
                                          ·{" "}
                                          {formatContentStudioDateTime(
                                            decision.decidedAt,
                                          )}
                                        </Typography>
                                      ))}
                                    </Stack>
                                  )}
                                </Box>
                                <Chip
                                  label={
                                    CONTENT_STAGE_STATUS_LABELS[stage.status]
                                  }
                                  size="small"
                                  variant="outlined"
                                />
                              </Stack>
                              <TextField
                                label="Conteúdo estruturado"
                                value={drafts[stage.id] ?? ""}
                                onChange={(event) =>
                                  handleDraftChange(
                                    stage.id,
                                    event.target.value,
                                  )
                                }
                                inputProps={{
                                  "data-testid": `content-studio-stage-content-${stage.id}`,
                                }}
                                disabled={PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(
                                  contentPackage.status,
                                )}
                                multiline
                                minRows={5}
                                spellCheck={false}
                              />
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                              >
                                {generationEnabled &&
                                  !PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(
                                    contentPackage.status,
                                  ) &&
                                  GENERATION_ALLOWED_STATUSES.includes(
                                    stage.status,
                                  ) &&
                                  stage.dependencies.every((dependency) => {
                                    const dependencyStage = track.stages.find(
                                      (candidate) =>
                                        candidate.stageType === dependency,
                                    );
                                    return (
                                      dependencyStage !== undefined &&
                                      [
                                        ContentStageStatus.DRAFT,
                                        ContentStageStatus.PRODUCER_APPROVED,
                                        ContentStageStatus.APPROVED,
                                      ].includes(dependencyStage.status)
                                    );
                                  }) && (
                                    <Button
                                      onClick={() =>
                                        void handleRequestGeneration(stage)
                                      }
                                      disabled={busyStageId === stage.id}
                                      startIcon={<AutoAwesome />}
                                      sx={{ minHeight: 44 }}
                                    >
                                      Solicitar geração
                                    </Button>
                                  )}
                                <Button
                                  onClick={() => void handleSaveContent(stage)}
                                  disabled={
                                    busyStageId === stage.id ||
                                    !MANUAL_EDIT_ALLOWED_STATUSES.includes(
                                      stage.status,
                                    ) ||
                                    PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(
                                      contentPackage.status,
                                    )
                                  }
                                  startIcon={<Save />}
                                  sx={{ minHeight: 44 }}
                                  variant="outlined"
                                >
                                  Salvar versão
                                </Button>
                                <Button
                                  onClick={() =>
                                    void handleCompleteProduction(stage)
                                  }
                                  disabled={
                                    busyStageId === stage.id ||
                                    !stage.currentVersionId ||
                                    stage.status !== ContentStageStatus.DRAFT ||
                                    PACKAGE_PRODUCTION_LOCKED_STATUSES.includes(
                                      contentPackage.status,
                                    )
                                  }
                                  startIcon={<TaskAlt />}
                                  sx={{ minHeight: 44 }}
                                  variant="contained"
                                >
                                  Concluir produção
                                </Button>
                              </Stack>
                              {reviewEnabled &&
                                [
                                  ContentPackageStatus.IN_REVIEW,
                                  ContentPackageStatus.CHANGES_REQUESTED,
                                ].includes(contentPackage.status) &&
                                stage.status ===
                                  ContentStageStatus.IN_REVIEW && (
                                  <Stack spacing={1}>
                                    <TextField
                                      label="Comentário para ajustes"
                                      value={changeMessages[stage.id] ?? ""}
                                      onChange={(event) =>
                                        handleChangeMessage(
                                          stage.id,
                                          event.target.value,
                                        )
                                      }
                                      multiline
                                      minRows={2}
                                    />
                                    <Stack
                                      direction={{ xs: "column", sm: "row" }}
                                      spacing={1}
                                    >
                                      <Button
                                        onClick={() =>
                                          void handleApproveStage(stage)
                                        }
                                        disabled={busyStageId === stage.id}
                                        startIcon={<TaskAlt />}
                                        sx={{ minHeight: 44 }}
                                        variant="contained"
                                      >
                                        Aprovar etapa
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          void handleRequestChanges(stage)
                                        }
                                        disabled={busyStageId === stage.id}
                                        sx={{ minHeight: 44 }}
                                        variant="outlined"
                                      >
                                        Solicitar ajustes
                                      </Button>
                                    </Stack>
                                  </Stack>
                                )}
                            </Stack>
                            <Divider sx={{ mt: 1.5 }} />
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
