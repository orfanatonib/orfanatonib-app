import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { FeatureFlagKeys, useIsFeatureEnabled } from "@/features/feature-flags";
import { getHttpStatus } from "@/utils/apiError";

import { approveReviewStage, requestStageChanges, resolveReviewComment } from "../api";
import {
  BULK_BUSY_ID,
  HTTP_STATUS_CONFLICT,
  REVIEW_FEEDBACK_TEXTS,
  REVIEW_NOTE_MAX_LENGTH,
  REVIEW_QUERY,
} from "../review-workspace.constants";
import {
  approvableStages,
  isTrackPublished,
  nextPendingStage,
  publishableTracks,
  pendingStages,
  releasedStages,
  releasedTracks,
  reviewBlockReason,
  reviewHeaderStatus,
  reviewSummary,
} from "../review-workspace.utils";
import { ReviewBlockReason } from "../review-workspace.types";
import { ContentPackageStatus, ContentStageStatus, type ContentStageResponse } from "../types";
import type { FeedbackState } from "../workspace.types";
import { useAcknowledgedVersions } from "./useAcknowledgedVersions";
import { useContentPackage } from "./useContentPackage";
import { useReviewNotes } from "./useReviewNotes";

/** Estado e ações da tela de revisão de um material: só as categorias liberadas, uma etapa por vez. */
export function useReviewWorkspace(packageId: string | undefined) {
  const { contentPackage, loading, error, reload } = useContentPackage(packageId);
  const reviewEnabled = useIsFeatureEnabled(FeatureFlagKeys.CONTENT_STUDIO_REVIEW);
  const [params, setParams] = useSearchParams();
  const notes = useReviewNotes(packageId);
  const acknowledged = useAcknowledgedVersions(packageId, contentPackage?.tracks);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busyStageId, setBusyStageId] = useState<string | null>(null);
  /** Cada incremento pede ao componente de publicação para abrir o diálogo (depois de "Aprovar tudo"). */
  const [publishRequest, setPublishRequest] = useState(0);

  const allTracks = contentPackage?.tracks;
  const tracks = useMemo(() => releasedTracks(allTracks ?? []), [allTracks]);
  const track = tracks.find((item) => item.audience === params.get(REVIEW_QUERY.audience)) ?? tracks[0];
  const stages = useMemo(() => releasedStages(track), [track]);
  const stage = stages.find((item) => item.stageType === params.get(REVIEW_QUERY.stage)) ?? pendingStages(track)[0] ?? stages[0];

  // A URL sempre diz onde o revisor está: o link copiado ou recarregado volta exatamente para esta etapa.
  const audienceKey = track?.audience;
  const stageKey = stage?.stageType;
  useEffect(() => {
    if (!audienceKey || !stageKey) return;
    if (params.get(REVIEW_QUERY.audience) === audienceKey && params.get(REVIEW_QUERY.stage) === stageKey) return;
    const next = new URLSearchParams(params);
    next.set(REVIEW_QUERY.audience, audienceKey);
    next.set(REVIEW_QUERY.stage, stageKey);
    setParams(next, { replace: true });
  }, [audienceKey, stageKey, params, setParams]);

  const selectTrack = useCallback(
    (audience: string) => {
      const next = new URLSearchParams(params);
      next.set(REVIEW_QUERY.audience, audience);
      next.delete(REVIEW_QUERY.stage);
      setParams(next);
    },
    [params, setParams],
  );
  const selectStage = useCallback(
    (stageType: string) => {
      const next = new URLSearchParams(params);
      next.set(REVIEW_QUERY.stage, stageType);
      setParams(next);
    },
    [params, setParams],
  );

  const summary = useMemo(() => reviewSummary(allTracks ?? []), [allTracks]);
  const versionChanged = acknowledged.hasChanged(stage);
  // Categoria já em Materiais de Visita: nada mais a decidir nela.
  const trackPublished = !!contentPackage && !!track && isTrackPublished(track, contentPackage.status);
  const block = contentPackage
    ? reviewBlockReason({ reviewEnabled, packageStatus: contentPackage.status, stage, versionChanged, trackPublished })
    : null;
  const packageStatus = contentPackage?.status ?? ContentPackageStatus.DRAFT;
  // "Aprovar tudo": etapas pendentes de todas as categorias liberadas e ainda não publicadas.
  const approvable = useMemo(() => approvableStages(allTracks ?? [], packageStatus), [allTracks, packageStatus]);
  const approveAllBlocked = approvable.some((item) => acknowledged.hasChanged(item));
  // Só os itens pendentes da categoria aberta (e só enquanto a revisão ainda pode decidir).
  const categoryPending = useMemo(
    () =>
      trackPublished || block === ReviewBlockReason.DISABLED || block === ReviewBlockReason.PACKAGE_CLOSED ? [] : pendingStages(track),
    [trackPublished, block, track],
  );
  const categoryBlocked = categoryPending.some((item) => acknowledged.hasChanged(item));
  const publishable = useMemo(() => publishableTracks(allTracks ?? [], packageStatus), [allTracks, packageStatus]);
  const firstPublication = !(allTracks ?? []).some((item) => isTrackPublished(item, packageStatus));
  const note = stage ? (notes.notes[stage.id] ?? "") : "";
  const next = nextPendingStage(track, stage?.id);
  const busy = busyStageId !== null;

  /** Roda a decisão, recarrega o material e, se deu certo, leva o revisor à próxima etapa pendente. */
  const decide = async (target: ContentStageResponse, run: () => Promise<void>, success: string, failure: string) => {
    setFeedback(null);
    setBusyStageId(target.id);
    try {
      await run();
      await reload();
      setFeedback({ severity: "success", message: success });
      const following = nextPendingStage(track, target.id);
      if (following) selectStage(following.stageType);
    } catch (caught) {
      if (getHttpStatus(caught) === HTTP_STATUS_CONFLICT) {
        // Alguém mexeu na etapa: traz a versão atual e exige reler antes de decidir de novo.
        setFeedback({ severity: "error", message: REVIEW_FEEDBACK_TEXTS.stale });
        await reload();
      } else {
        setFeedback({ severity: "error", message: failure });
      }
    } finally {
      setBusyStageId(null);
    }
  };

  const approve = async (target: ContentStageResponse) => {
    if (!contentPackage || !target.currentVersion || target.status !== ContentStageStatus.IN_REVIEW) return;
    const version = target.currentVersion;
    await decide(
      target,
      async () => {
        await approveReviewStage(contentPackage.id, target.id, {
          versionId: version.id,
          lockVersion: target.lockVersion,
          contentChecksum: version.contentChecksum,
        });
      },
      REVIEW_FEEDBACK_TEXTS.approved,
      REVIEW_FEEDBACK_TEXTS.approveFailed,
    );
  };

  const requestChanges = async (target: ContentStageResponse) => {
    if (!contentPackage || !target.currentVersion || target.status !== ContentStageStatus.IN_REVIEW) return;
    const message = (notes.notes[target.id] ?? "").trim().slice(0, REVIEW_NOTE_MAX_LENGTH);
    if (!message) {
      setFeedback({ severity: "error", message: REVIEW_FEEDBACK_TEXTS.needNote });
      return;
    }
    const version = target.currentVersion;
    await decide(
      target,
      async () => {
        await requestStageChanges(contentPackage.id, target.id, {
          versionId: version.id,
          lockVersion: target.lockVersion,
          contentChecksum: version.contentChecksum,
          message,
        });
        notes.clearSent(target.id, notes.notes[target.id] ?? "");
      },
      REVIEW_FEEDBACK_TEXTS.returned,
      REVIEW_FEEDBACK_TEXTS.returnFailed,
    );
  };

  /** Aprova, um a um, os itens recebidos (o revisor confirmou antes). `thenPublish` pede para abrir a publicação se der. */
  const approveStages = async (targets: readonly ContentStageResponse[], thenPublish: boolean) => {
    if (!contentPackage || targets.length === 0) return;
    setFeedback(null);
    setBusyStageId(BULK_BUSY_ID);
    let approved = 0;
    let readyToPublish = false;
    try {
      for (const target of targets) {
        if (!target.currentVersion) continue;
        const updated = await approveReviewStage(contentPackage.id, target.id, {
          versionId: target.currentVersion.id,
          lockVersion: target.lockVersion,
          contentChecksum: target.currentVersion.contentChecksum,
        });
        approved += 1;
        readyToPublish = publishableTracks(updated.tracks, updated.status).length > 0;
      }
      await reload();
      setFeedback({ severity: "success", message: REVIEW_FEEDBACK_TEXTS.approvedAll(approved) });
      if (thenPublish && readyToPublish) setPublishRequest((current) => current + 1);
    } catch (caught) {
      // Parou no meio: o que já foi aprovado fica aprovado; a tela mostra o estado real.
      setFeedback({
        severity: "error",
        message: getHttpStatus(caught) === HTTP_STATUS_CONFLICT ? REVIEW_FEEDBACK_TEXTS.stale : REVIEW_FEEDBACK_TEXTS.approveFailed,
      });
      await reload();
    } finally {
      setBusyStageId(null);
    }
  };

  /** "Aprovar esta categoria": todos os itens pendentes da categoria aberta. */
  const approveCategory = () => (categoryBlocked ? Promise.resolve() : approveStages(categoryPending, false));

  /** "Aprovar tudo": todos os itens pendentes de todas as categorias e, se der, abre a publicação. */
  const approveAll = () => (approveAllBlocked ? Promise.resolve() : approveStages(approvable, true));

  const resolveComment = async (commentId: string, stageId: string, message: string) => {
    if (!contentPackage) return;
    setBusyStageId(stageId);
    try {
      await resolveReviewComment(contentPackage.id, commentId, message);
      await reload();
    } catch {
      setFeedback({ severity: "error", message: REVIEW_FEEDBACK_TEXTS.resolveFailed });
    } finally {
      setBusyStageId(null);
    }
  };

  return {
    contentPackage,
    loading,
    error,
    reload,
    reviewEnabled,
    tracks,
    track,
    stages,
    stage,
    summary,
    headerStatus: contentPackage ? reviewHeaderStatus(contentPackage.status, summary) : null,
    block,
    canDecide: block === null && !busy,
    versionChanged,
    acknowledge: acknowledged.acknowledge,
    notes,
    note,
    next,
    pendingCount: pendingStages(track).length,
    feedback,
    setFeedback,
    busy,
    busyStageId,
    selectTrack,
    selectStage,
    approve,
    requestChanges,
    resolveComment,
    approvableCount: approvable.length,
    approveAllBlocked,
    approveAll,
    categoryPendingCount: categoryPending.length,
    categoryBlocked,
    approveCategory,
    publishableNames: publishable.map((item) => item.audienceName),
    firstPublication,
    publishRequest,
  };
}

export type ReviewWorkspace = ReturnType<typeof useReviewWorkspace>;
