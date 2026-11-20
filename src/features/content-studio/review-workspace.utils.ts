import { ContentAudience, ContentPackageStatus, ContentReviewCommentStatus, ContentStageStatus } from "./types";
import type { ContentPackageListItemResponse, ContentStageResponse, ContentStageSegment, ContentTrackResponse } from "./types";
import { REVIEW_DECISION_CLOSED_PACKAGE_STATUSES, RELEASED_STAGE_STATUSES } from "./review-workspace.constants";
import { ReviewBlockReason } from "./review-workspace.types";
import type { ReviewDecisionInput, ReviewHeaderStatus, ReviewSummary } from "./review-workspace.types";

/** A etapa foi liberada para revisão pela produção? */
export const isReleasedStatus = (status: ContentStageStatus): boolean => RELEASED_STAGE_STATUSES.includes(status);

export const isReleasedStage = (stage: Pick<ContentStageResponse, "status">): boolean => isReleasedStatus(stage.status);

/** Categorias que a produção liberou para revisão: têm ao menos uma etapa nas mãos do revisor. */
export function releasedTracks(tracks: readonly ContentTrackResponse[]): ContentTrackResponse[] {
  return tracks.filter((track) => track.stages.some(isReleasedStage));
}

/** Categorias que ainda estão só na produção (não aparecem na revisão). */
export function unreleasedTracks(tracks: readonly ContentTrackResponse[]): ContentTrackResponse[] {
  return tracks.filter((track) => !track.stages.some(isReleasedStage));
}

/** Etapas da categoria que o revisor enxerga, na ordem de produção. */
export function releasedStages(track: ContentTrackResponse | undefined): ContentStageResponse[] {
  return (track?.stages ?? []).filter(isReleasedStage).sort((a, b) => a.position - b.position);
}

const toSummary = (counts: { approved: number; awaiting: number; returned: number; total: number }): ReviewSummary => ({
  ...counts,
  percent: counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0,
});

/** Andamento da revisão, contando só as etapas liberadas (as categorias em produção não pesam). */
export function reviewSummary(tracks: readonly ContentTrackResponse[]): ReviewSummary {
  const stages = releasedTracks(tracks).flatMap((track) =>
    track.stages.filter((stage) => stage.status !== ContentStageStatus.NOT_REQUIRED),
  );
  const count = (status: ContentStageStatus) => stages.filter((stage) => stage.status === status).length;
  return toSummary({
    approved: count(ContentStageStatus.APPROVED),
    awaiting: count(ContentStageStatus.IN_REVIEW),
    returned: count(ContentStageStatus.CHANGES_REQUESTED),
    total: stages.length,
  });
}

/** Uma linha que diz o que falta. */
export function reviewProgressText(summary: ReviewSummary): string {
  const parts = [`${summary.approved} de ${summary.total} itens aprovados`];
  if (summary.awaiting > 0) parts.push(`${summary.awaiting} ${summary.awaiting === 1 ? "aguarda" : "aguardam"} sua decisão`);
  if (summary.returned > 0) parts.push(`${summary.returned} ${summary.returned === 1 ? "devolvida" : "devolvidas"}`);
  return parts.join(" · ");
}

/** Etapas da categoria que esperam a decisão do revisor. */
export function pendingStages(track: ContentTrackResponse | undefined): ContentStageResponse[] {
  return releasedStages(track).filter((stage) => stage.status === ContentStageStatus.IN_REVIEW);
}

/** A próxima etapa pendente depois da atual (volta ao começo se for a última); `null` se não houver outra. */
export function nextPendingStage(track: ContentTrackResponse | undefined, currentId: string | undefined): ContentStageResponse | null {
  const pending = pendingStages(track).filter((stage) => stage.id !== currentId);
  if (pending.length === 0) return null;
  const ordered = releasedStages(track);
  const from = ordered.findIndex((stage) => stage.id === currentId);
  return pending.find((stage) => ordered.findIndex((item) => item.id === stage.id) > from) ?? pending[0];
}

/** O revisor ainda tem o que decidir neste material? */
export const isReviewDecisionOpen = (status: ContentPackageStatus): boolean => !REVIEW_DECISION_CLOSED_PACKAGE_STATUSES.includes(status);

/** Motivo de o revisor não poder decidir (ou `null` quando pode aprovar ou devolver). */
export function reviewBlockReason(input: ReviewDecisionInput): ReviewBlockReason | null {
  const { reviewEnabled, packageStatus, stage, versionChanged, trackPublished } = input;
  if (!reviewEnabled) return ReviewBlockReason.DISABLED;
  if (trackPublished) return ReviewBlockReason.TRACK_PUBLISHED;
  if (!isReviewDecisionOpen(packageStatus)) return ReviewBlockReason.PACKAGE_CLOSED;
  if (!stage) return ReviewBlockReason.NOT_RELEASED;
  if (stage.status === ContentStageStatus.APPROVED) return ReviewBlockReason.APPROVED;
  if (stage.status === ContentStageStatus.CHANGES_REQUESTED) return ReviewBlockReason.RETURNED;
  if (stage.status !== ContentStageStatus.IN_REVIEW) return ReviewBlockReason.NOT_RELEASED;
  if (!stage.currentVersionId || !stage.currentVersion) return ReviewBlockReason.NO_VERSION;
  if (versionChanged) return ReviewBlockReason.VERSION_CHANGED;
  return null;
}

/** Situação do material no cabeçalho da revisão, em poucas palavras. */
export function reviewHeaderStatus(packageStatus: ContentPackageStatus, summary: ReviewSummary): ReviewHeaderStatus {
  if (packageStatus === ContentPackageStatus.ARCHIVED) return { label: "Arquivado", color: "default" };
  if (packageStatus === ContentPackageStatus.PUBLISHED) return { label: "Publicado", color: "success" };
  if (packageStatus === ContentPackageStatus.PUBLISHING) return { label: "Publicando…", color: "info" };
  if (packageStatus === ContentPackageStatus.READY_FOR_PUBLICATION) return { label: "Pronto para publicar", color: "success" };
  if (summary.total > 0 && summary.approved === summary.total) return { label: "Liberado aprovado", color: "success" };
  return { label: `${summary.approved} de ${summary.total} itens aprovados`, color: "warning" };
}

/** Quantas observações da etapa ainda estão em aberto (para o aviso na aba). */
export const openCommentsCount = (stage: Pick<ContentStageResponse, "reviewComments">): number =>
  stage.reviewComments.filter((comment) => comment.status === ContentReviewCommentStatus.OPEN).length;

/** Memória das versões que o revisor já viu: etapa → versão. Uma versão diferente exige reler antes de decidir. */
export type AcknowledgedVersions = Readonly<Record<string, string | null>>;

/** Acrescenta ao registro as etapas ainda desconhecidas, sem sobrescrever o que o revisor já viu. */
export function captureStageVersions(current: AcknowledgedVersions, tracks: readonly ContentTrackResponse[]): AcknowledgedVersions {
  const next: Record<string, string | null> = { ...current };
  let changed = false;
  for (const stage of tracks.flatMap((track) => track.stages)) {
    if (!(stage.id in next)) {
      next[stage.id] = stage.currentVersionId;
      changed = true;
    }
  }
  return changed ? next : current;
}

/** A versão atual da etapa é diferente da que o revisor viu? */
export function hasStageVersionChanged(
  versions: AcknowledgedVersions,
  stage: Pick<ContentStageResponse, "id" | "currentVersionId"> | undefined,
): boolean {
  if (!stage || !(stage.id in versions)) return false;
  return versions[stage.id] !== stage.currentVersionId;
}

/** Categorias liberadas, vistas pelo cartão da fila (que só traz os segmentos de cada etapa). */
export function releasedSegmentAudiences(segments: readonly ContentStageSegment[]): ContentAudience[] {
  const audiences = new Set(segments.filter((segment) => isReleasedStatus(segment.status)).map((segment) => segment.audience));
  return [...audiences];
}

/** Segmentos só das categorias liberadas: o cartão não mostra o que ainda está em produção. */
export function releasedSegments(segments: readonly ContentStageSegment[]): ContentStageSegment[] {
  const audiences = new Set(releasedSegmentAudiences(segments));
  return segments.filter((segment) => audiences.has(segment.audience));
}

/** Resumo do cartão da fila, só das categorias liberadas. */
export function releasedListSummary(item: Pick<ContentPackageListItemResponse, "stageSegments"> & { publishedAudiences?: readonly ContentAudience[] }): ReviewSummary {
  // O que já está em Materiais de Visita saiu da revisão: não entra na conta do que falta decidir.
  const published = new Set(item.publishedAudiences ?? []);
  const segments = releasedSegments(item.stageSegments ?? []).filter(
    (segment) => segment.status !== ContentStageStatus.NOT_REQUIRED && !published.has(segment.audience),
  );
  const count = (status: ContentStageStatus) => segments.filter((segment) => segment.status === status).length;
  return toSummary({
    approved: count(ContentStageStatus.APPROVED),
    awaiting: count(ContentStageStatus.IN_REVIEW),
    returned: count(ContentStageStatus.CHANGES_REQUESTED),
    total: segments.length,
  });
}

/** A categoria já está em Materiais de Visita? (pacote antigo `PUBLISHED` publicou o pacote inteiro). */
export const isTrackPublished = (track: Pick<ContentTrackResponse, "publishedAt">, packageStatus: ContentPackageStatus): boolean =>
  track.publishedAt !== null || packageStatus === ContentPackageStatus.PUBLISHED;

/** Categorias que a publicação levaria agora: todas as etapas obrigatórias aprovadas e ainda não publicadas. */
export function publishableTracks(tracks: readonly ContentTrackResponse[], packageStatus: ContentPackageStatus): ContentTrackResponse[] {
  return tracks.filter((track) => {
    if (isTrackPublished(track, packageStatus)) return false;
    const required = track.stages.filter((stage) => stage.required);
    return (
      required.length > 0 && required.every((stage) => stage.status === ContentStageStatus.APPROVED && stage.currentVersionId !== null)
    );
  });
}

/** Etapas que esperam decisão em todas as categorias liberadas ainda não publicadas, na ordem das categorias. */
export function approvableStages(tracks: readonly ContentTrackResponse[], packageStatus: ContentPackageStatus): ContentStageResponse[] {
  return releasedTracks(tracks)
    .filter((track) => !isTrackPublished(track, packageStatus))
    .flatMap((track) => pendingStages(track));
}
