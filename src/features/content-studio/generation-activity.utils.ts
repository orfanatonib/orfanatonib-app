import { GenerationJobStatus } from "./generation.utils";
import {
  AiGenerationCapability,
  type ContentAudience,
  type ContentAudienceDefinitionResponse,
  type GenerationActivityItem,
  type ImageJobProgress,
  type TextJobProgress,
  type TextJobStep,
} from "./types";

/** Quanto, em média, a IA leva escrevendo um conteúdo: só calibra a barra enquanto o provedor não responde. */
export const WRITING_ESTIMATE_MS = 45_000;

export interface ProgressStep {
  key: string;
  label: string;
}

/** Linha do tempo de uma geração de texto. */
export const TEXT_STEPS: readonly ProgressStep[] = [
  { key: "QUEUED", label: "Fila" },
  { key: "PREPARING", label: "Preparo" },
  { key: "WRITING", label: "Escrita" },
  { key: "VALIDATING", label: "Revisão" },
  { key: "SAVING", label: "Salvar" },
];

export const IMAGE_STEPS: readonly ProgressStep[] = [
  { key: "QUEUED", label: "Na fila" },
  { key: "DRAWING", label: "Desenhando" },
  { key: "DONE", label: "Finalizando" },
];

const STEP_INDEX: Record<TextJobStep, number> = { PREPARING: 1, WRITING: 2, VALIDATING: 3, SAVING: 4 };
/** Percentual em que cada fase de texto começa (a de escrita avança sozinha até 80%). */
const STEP_FLOOR: Record<TextJobStep, number> = { PREPARING: 8, WRITING: 15, VALIDATING: 85, SAVING: 94 };

export interface JobProgressView {
  steps: readonly ProgressStep[];
  /** Posição atual na linha do tempo (0-based). */
  stepIndex: number;
  /** 0–100. */
  percent: number;
  headline: string;
  /** Quando o número é real (imagens X de Y) e não estimado. */
  exact: boolean;
  retrying: boolean;
  /** Tempo desde que o pedido entrou (ms). */
  elapsedMs: number;
}

export type ProgressJob = Pick<GenerationActivityItem, "status" | "attempts" | "progress" | "startedAt" | "capability">;

const isImages = (progress: ProgressJob["progress"]): progress is ImageJobProgress => progress?.phase === "IMAGES";
const isText = (progress: ProgressJob["progress"]): progress is TextJobProgress => progress?.phase === "TEXT";

/** Estimativa que sobe rápido e desacelera: nunca chega ao teto, então a barra não "mente" que terminou. */
export const easedProgress = (elapsedMs: number, from: number, to: number, estimateMs = WRITING_ESTIMATE_MS): number =>
  from + (to - from) * (1 - Math.exp(-Math.max(0, elapsedMs) / estimateMs));

/** Traduz o job (status + fase gravada pelo servidor) no que a tela desenha: etapa, percentual e frase. */
export function describeJobProgress(job: ProgressJob, now: number = Date.now()): JobProgressView {
  const elapsedMs = Math.max(0, now - new Date(job.startedAt).getTime());
  const retrying = job.status === GenerationJobStatus.RETRY_SCHEDULED;
  const imageJob = job.capability === AiGenerationCapability.IMAGE_GENERATION || isImages(job.progress);
  const steps = imageJob ? IMAGE_STEPS : TEXT_STEPS;

  if (job.status === GenerationJobStatus.PENDING) {
    return { steps, stepIndex: 0, percent: 3, exact: false, retrying: false, elapsedMs, headline: "Na fila: já vai começar" };
  }
  if (retrying) {
    return {
      steps,
      stepIndex: 0,
      percent: 5,
      exact: false,
      retrying: true,
      elapsedMs,
      headline: "O provedor está ocupado; tentando de novo em instantes",
    };
  }
  if (imageJob) {
    const progress = isImages(job.progress) ? job.progress : null;
    const total = progress?.total ?? 0;
    if (!progress || total === 0)
      return { steps, stepIndex: 1, percent: 6, exact: false, retrying: false, elapsedMs, headline: "Preparando o desenho das imagens" };
    const done = Math.min(progress.done, total);
    return {
      steps,
      stepIndex: done >= total ? 2 : 1,
      percent: Math.max(6, Math.round((done / total) * 100)),
      exact: true,
      retrying: false,
      elapsedMs,
      headline: done >= total ? "Finalizando as imagens" : `Desenhando a imagem ${done + 1} de ${total}`,
    };
  }
  const text = isText(job.progress) ? job.progress : null;
  const step: TextJobStep = text?.step ?? "PREPARING";
  const stepElapsed = text ? Math.max(0, now - new Date(text.startedAt).getTime()) : elapsedMs;
  const percent =
    step === "WRITING" ? easedProgress(stepElapsed, STEP_FLOOR.WRITING, 80) : STEP_FLOOR[step];
  const headlines: Record<TextJobStep, string> = {
    PREPARING: "Preparando o contexto da etapa",
    WRITING: "A IA está escrevendo o conteúdo",
    VALIDATING: "Conferindo se segue as regras da faixa etária",
    SAVING: "Salvando a nova versão",
  };
  return {
    steps,
    stepIndex: STEP_INDEX[step],
    percent: Math.min(99, Math.round(percent)),
    exact: false,
    retrying: false,
    elapsedMs,
    headline: job.attempts > 1 ? `${headlines[step]} (tentativa ${job.attempts})` : headlines[step],
  };
}

/** "1:05", "12:30". */
export function formatElapsed(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

/** "38 s", "2 min 05 s". */
export function formatDuration(ms: number): string {
  const total = Math.round(Math.max(0, ms) / 1000);
  if (total < 60) return `${total} s`;
  return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, "0")} s`;
}

export interface ActivityPackageGroup {
  packageId: string;
  theme: string;
  biblicalReferences: string;
  items: GenerationActivityItem[];
}

/** Agrupa as gerações ativas por material (na ordem em que chegaram) e, dentro dele, por faixa etária. */
export function groupActivityByPackage(active: readonly GenerationActivityItem[], order: readonly ContentAudience[] = []): ActivityPackageGroup[] {
  const groups = new Map<string, ActivityPackageGroup>();
  for (const item of active) {
    const group = groups.get(item.packageId) ?? {
      packageId: item.packageId,
      theme: item.theme,
      biblicalReferences: item.biblicalReferences,
      items: [],
    };
    group.items.push(item);
    groups.set(item.packageId, group);
  }
  const rank = (audience: ContentAudience) => {
    const index = order.indexOf(audience);
    return index === -1 ? order.length : index;
  };
  return [...groups.values()].map((group) => ({ ...group, items: [...group.items].sort((a, b) => rank(a.audience) - rank(b.audience)) }));
}

export const audienceLabel = (audience: string, catalog: readonly ContentAudienceDefinitionResponse[]): string =>
  catalog.find((item) => item.audience === audience)?.name ?? audience;
