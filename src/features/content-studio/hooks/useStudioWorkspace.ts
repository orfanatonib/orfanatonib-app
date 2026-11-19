import { useEffect, useRef, useState } from "react";
import {
  approveReviewStage,
  archiveContentPackage,
  completeProductionStage,
  requestStageGeneration,
  getLatestStageGeneration,
  streamPackageGenerations,
  cancelStageGeneration,
  requestStageChanges,
  saveStageContent,
  submitPackageReview,
  resolveReviewComment,
} from "../api";
import { useContentPackage } from "./useContentPackage";
import { FeatureFlagKeys, useIsFeatureEnabled } from "@/features/feature-flags";
import {
  ContentPackageStatus,
  ContentStageStatus,
  type TiptapDocument,
  type ContentGenerationJobResponse,
  type ContentStageResponse,
} from "../types";
import {
  GENERATION_POLL_INTERVAL_MS,
  GENERATION_POLL_MAX_MS,
  STREAM_FALLBACK_WAIT_MS,
  STREAM_MAX_FAILURES,
  GenerationJobStatus,
  generationErrorMessage,
  isGenerationActive,
} from "../generation.utils";
import { readStudioDrafts, writeStudioDrafts } from "../draftStorage";
import type { StudioDrafts } from "../workspace.types";
import type { FeedbackState } from "../workspace.types";
import {
  capabilityForStage,
  stageDraftValue,
  isRecord,
} from "../workspace.utils";

export function useStudioWorkspace(id: string | undefined) {
  const { contentPackage, loading, error, reload } = useContentPackage(id);
  const reviewEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO_REVIEW,
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const localDrafts = useRef<StudioDrafts>({});
  const [draftStorageFailed, setDraftStorageFailed] = useState(false);
  useEffect(() => {
    localDrafts.current = id ? readStudioDrafts(id) : {};
    setDrafts(
      Object.fromEntries(
        Object.entries(localDrafts.current).map(([key, draft]) => [
          key,
          draft.value,
        ]),
      ),
    );
  }, [id]);
  const [changeMessages, setChangeMessages] = useState<Record<string, string>>(
    {},
  );
  const [busyStageId, setBusyStageId] = useState<string | null>(null);
  const [packageBusy, setPackageBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const generationKeys = useRef<Record<string, string>>({});
  /** Andamento por etapa (fila → gerando → nova tentativa → fim), alimentado por polling. */
  const [generationJobs, setGenerationJobs] = useState<
    Record<string, ContentGenerationJobResponse>
  >({});
  const pollControllers = useRef<Record<string, AbortController>>({});
  /** Stream SSE de andamento (um por pacote): empurra os jobs; o polling HTTP só entra se ele falhar. */
  const streamJobs = useRef<Record<string, ContentGenerationJobResponse>>({});
  const streamController = useRef<AbortController | null>(null);
  const streamFailures = useRef(0);
  const wakeups = useRef(new Set<() => void>());
  const wakeAll = () => wakeups.current.forEach((wake) => wake());
  const generationEnabled = useIsFeatureEnabled(
    FeatureFlagKeys.CONTENT_STUDIO_GENERATION,
  );

  useEffect(() => {
    if (!contentPackage) return;

    const stages = contentPackage.tracks.flatMap((track) => track.stages);
    setDrafts(
      Object.fromEntries(
        stages.map((stage) => [
          stage.id,
          localDrafts.current[stage.id]?.value ?? stageDraftValue(stage),
        ]),
      ),
    );
  }, [contentPackage]);

  const handleDraftChange = (stageId: string, value: string) => {
    setDrafts((current) => ({ ...current, [stageId]: value }));
    const stage = contentPackage?.tracks
      .flatMap((track) => track.stages)
      .find((item) => item.id === stageId);
    if (!stage || !id) return;
    if (value === stageDraftValue(stage)) delete localDrafts.current[stageId];
    else
      localDrafts.current[stageId] = {
        value,
        baseVersionId: localDrafts.current[stageId]
          ? localDrafts.current[stageId].baseVersionId
          : stage.currentVersionId,
      };
    setDraftStorageFailed(!writeStudioDrafts(id, localDrafts.current));
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

  const ensureStream = (packageId: string) => {
    if (
      streamController.current ||
      streamFailures.current >= STREAM_MAX_FAILURES
    )
      return;
    const controller = new AbortController();
    streamController.current = controller;
    streamPackageGenerations(packageId, controller.signal, {
      onJobs: (jobs) => {
        streamFailures.current = 0;
        for (const item of jobs) streamJobs.current[item.stageId] = item;
        wakeAll();
      },
    })
      .catch(() => {
        if (!controller.signal.aborted) streamFailures.current += 1;
      })
      .finally(() => {
        if (streamController.current === controller)
          streamController.current = null;
        wakeAll();
      });
  };

  /** Espera `ms` ou até o stream trazer algo novo (o que vier primeiro). */
  const waitForUpdate = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        wakeups.current.delete(done);
        signal.removeEventListener("abort", done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      wakeups.current.add(done);
      signal.addEventListener("abort", done, { once: true });
    });

  /** Acompanha o job até terminar (ou o teto de tempo): por SSE quando possível, por polling HTTP como reserva. */
  const pollGeneration = async (stageId: string) => {
    if (!contentPackage) return;
    pollControllers.current[stageId]?.abort();
    const controller = new AbortController();
    pollControllers.current[stageId] = controller;
    const packageId = contentPackage.id;
    const startedAt = Date.now();
    /** Job conhecido pela leitura HTTP: o stream só vale para ele ou para um mais novo (nunca para um anterior). */
    let seed: ContentGenerationJobResponse | null = null;
    let seeded = false;

    while (
      !controller.signal.aborted &&
      Date.now() - startedAt < GENERATION_POLL_MAX_MS
    ) {
      ensureStream(packageId);
      const streamed = streamJobs.current[stageId];
      const streamUsable =
        seeded &&
        !!streamed &&
        (!seed ||
          streamed.id === seed.id ||
          new Date(streamed.createdAt) > new Date(seed.createdAt));
      let job: ContentGenerationJobResponse | null = null;
      if (streamUsable) {
        job = streamed;
      } else {
        try {
          job = await getLatestStageGeneration(packageId, stageId);
          seeded = true;
          seed = job;
        } catch {
          // Falha pontual de rede: tenta de novo no próximo ciclo.
        }
      }
      if (controller.signal.aborted) return;
      if (job)
        setGenerationJobs((current) => ({
          ...current,
          [stageId]: job as ContentGenerationJobResponse,
        }));
      if (job && !isGenerationActive(job)) {
        delete pollControllers.current[stageId];
        if (job.status === GenerationJobStatus.SUCCEEDED) {
          setFeedback({
            severity: "success",
            message: "Conteúdo gerado. Revise antes de seguir.",
          });
        } else if (job.status === GenerationJobStatus.FAILED) {
          setFeedback({
            severity: "error",
            message: generationErrorMessage(job),
          });
        }
        await reload();
        return;
      }
      await waitForUpdate(
        streamController.current
          ? STREAM_FALLBACK_WAIT_MS
          : GENERATION_POLL_INTERVAL_MS,
        controller.signal,
      );
    }
    if (!controller.signal.aborted) {
      setFeedback({
        severity: "error",
        message:
          "A geração está demorando mais que o normal. Atualize a página para ver o resultado.",
      });
    }
  };

  // Ao abrir o pacote, retoma o acompanhamento de etapas que já estavam gerando; ao sair, para tudo.
  useEffect(() => {
    if (!contentPackage) return;
    for (const stage of contentPackage.tracks.flatMap(
      (track) => track.stages,
    )) {
      if (
        stage.status === ContentStageStatus.GENERATING &&
        !pollControllers.current[stage.id]
      ) {
        void pollGeneration(stage.id);
      } else if (stage.status === ContentStageStatus.FAILED) {
        // Etapa que já abriu falhada: busca o motivo para a mensagem ser específica.
        void getLatestStageGeneration(contentPackage.id, stage.id)
          .then((job) => {
            if (job)
              setGenerationJobs((current) => ({ ...current, [stage.id]: job }));
          })
          .catch(() => undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentPackage?.id]);
  useEffect(
    () => () => {
      Object.values(pollControllers.current).forEach((controller) =>
        controller.abort(),
      );
      streamController.current?.abort();
    },
    [],
  );

  const handleRequestGeneration = async (stage: ContentStageResponse) => {
    if (!contentPackage) return;

    setFeedback(null);
    setBusyStageId(stage.id);
    try {
      const idempotencyKey =
        generationKeys.current[stage.id] ?? crypto.randomUUID();
      generationKeys.current[stage.id] = idempotencyKey;
      await requestStageGeneration(contentPackage.id, stage.id, {
        capability: capabilityForStage(),
        idempotencyKey,
        revisionInstructions: instructions[stage.id]?.trim() || undefined,
      });
      setFeedback({
        severity: "success",
        message:
          "Geração iniciada. O conteúdo aparecerá aqui quando estiver pronto.",
      });
      delete generationKeys.current[stage.id];
      await reload();
      void pollGeneration(stage.id);
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível solicitar geração para esta etapa.",
      });
    } finally {
      setBusyStageId(null);
    }
  };

  const handleCancelGeneration = async (stage: ContentStageResponse) => {
    if (!contentPackage) return;
    setBusyStageId(stage.id);
    try {
      pollControllers.current[stage.id]?.abort();
      delete pollControllers.current[stage.id];
      await cancelStageGeneration(contentPackage.id, stage.id);
      delete generationKeys.current[stage.id];
      setFeedback({ severity: "success", message: "Geração cancelada." });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message:
          "Não foi possível cancelar a geração. Atualize para verificar se ela já terminou.",
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
      delete localDrafts.current[stage.id];
      if (id)
        setDraftStorageFailed(!writeStudioDrafts(id, localDrafts.current));
      setFeedback({ severity: "success", message: "Nova versão salva." });
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível salvar o conteúdo desta etapa.",
      });
    } finally {
      setBusyStageId(null);
    }
  };

  /** Salva o documento rico como nova versão (os campos estruturados da versão atual seguem como estão). */
  const handleSaveDocument = async (
    stage: ContentStageResponse,
    document: TiptapDocument,
  ): Promise<boolean> => {
    if (!contentPackage) return false;
    setFeedback(null);
    try {
      await saveStageContent(contentPackage.id, stage.id, {
        structuredContent: stage.currentVersion?.structuredContent ?? {},
        contentDocument: document,
        templateVersion: contentPackage.templateCatalogVersion,
      });
      delete generationKeys.current[stage.id];
      setFeedback({
        severity: "success",
        message: "Documento salvo como nova versão.",
      });
      await reload();
      return true;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      setFeedback({
        severity: "error",
        message:
          status === 400
            ? "O documento não pôde ser salvo: confira se não há dados pessoais (documentos, telefones, nomes de acolhidos)."
            : "Não foi possível salvar o documento desta etapa.",
      });
      return false;
    }
  };

  /** Descarta as edições do documento: salva a versão só com os campos (o documento volta a ser montado deles). */
  const handleResetDocument = async (
    stage: ContentStageResponse,
  ): Promise<boolean> => {
    if (!contentPackage || !stage.currentVersion) return false;
    setFeedback(null);
    try {
      await saveStageContent(contentPackage.id, stage.id, {
        structuredContent: stage.currentVersion.structuredContent,
        templateVersion: contentPackage.templateCatalogVersion,
      });
      setFeedback({
        severity: "success",
        message: "Documento refeito a partir dos campos.",
      });
      await reload();
      return true;
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível refazer o documento.",
      });
      return false;
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

  const resolveComment = async (commentId: string, stageId: string) => {
    if (!contentPackage) return;
    setBusyStageId(stageId);
    try {
      await resolveReviewComment(contentPackage.id, commentId);
      await reload();
    } catch {
      setFeedback({
        severity: "error",
        message: "Não foi possível resolver o comentário.",
      });
    } finally {
      setBusyStageId(null);
    }
  };
  const conflictingDraftIds =
    contentPackage?.tracks
      .flatMap((track) => track.stages)
      .filter(
        (stage) =>
          localDrafts.current[stage.id] &&
          localDrafts.current[stage.id].baseVersionId !==
            stage.currentVersionId,
      )
      .map((stage) => stage.id) ?? [];
  return {
    draftStorageFailed,
    conflictingDraftIds,
    contentPackage,
    loading,
    error,
    reload,
    reviewEnabled,
    generationEnabled,
    drafts,
    instructions,
    setInstructions,
    changeMessages,
    busyStageId,
    generationJobs,
    packageBusy,
    feedback,
    setFeedback,
    handleDraftChange,
    handleChangeMessage,
    handleSubmitReview,
    handleRequestGeneration,
    handleCancelGeneration,
    handleSaveContent,
    handleSaveDocument,
    handleResetDocument,
    handleCompleteProduction,
    handleApproveStage,
    handleRequestChanges,
    canSubmitReview,
    canArchive,
    handleArchive,
    resolveComment,
  };
}

/** Tipo do retorno do hook, para os componentes da página de detalhe. */
export type StudioWorkspace = ReturnType<typeof useStudioWorkspace>;
