import { getApiErrorCode, getErrorMessage } from "@/utils/apiError";

import { AiGenerationCapability, ContentStageStatus, type ContentGenerationJobResponse, type ImageJobProgress } from "./types";

/** Código do 409 quando a geração não cabe nos limites do Estúdio (1 por categoria, 2 materiais ao mesmo tempo). */
export const GENERATION_CAPACITY_ERROR_CODE = "GENERATION_CAPACITY";

/** Estados do job de geração (espelham o enum da API). */
export enum GenerationJobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  RETRY_SCHEDULED = "RETRY_SCHEDULED",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export const GENERATION_POLL_INTERVAL_MS = 2000;
/**
 * Teto de segurança do acompanhamento de UMA geração (uma hora). O job vive no servidor e continua mesmo se a
 * página cair; a tela volta a acompanhá-lo ao reabrir. Não é mais um prazo curto: gerar com IA real leva tempo.
 */
export const GENERATION_POLL_MAX_MS = 60 * 60 * 1000;

/** Com o stream SSE ativo, o laço só acorda sozinho a cada tanto (um evento o acorda antes). */
export const STREAM_FALLBACK_WAIT_MS = 10_000;
/** O stream nunca é abandonado: ao falhar, o polling HTTP cobre o intervalo e a reconexão tenta de novo com backoff. */
export const STREAM_RECONNECT_BASE_MS = 1_000;
export const STREAM_RECONNECT_MAX_MS = 15_000;
export const STREAM_RECONNECT_JITTER_RATIO = 0.3;
/** Sem nenhum byte (nem o heartbeat de 15 s do servidor) por este tempo, a conexão é tida como morta e refeita. */
export const STREAM_STALE_MS = 45_000;

const ACTIVE = new Set<string>([
  GenerationJobStatus.PENDING,
  GenerationJobStatus.RUNNING,
  GenerationJobStatus.RETRY_SCHEDULED,
]);

export const isGenerationActive = (
  job: Pick<ContentGenerationJobResponse, "status"> | null,
): boolean => !!job && ACTIVE.has(job.status);

const STATUS_LABELS: Record<GenerationJobStatus, string> = {
  [GenerationJobStatus.PENDING]: "Na fila para gerar…",
  [GenerationJobStatus.RUNNING]: "Gerando o conteúdo…",
  [GenerationJobStatus.RETRY_SCHEDULED]:
    "O provedor está ocupado; tentando de novo…",
  [GenerationJobStatus.SUCCEEDED]: "Conteúdo gerado.",
  [GenerationJobStatus.FAILED]: "A geração falhou.",
  [GenerationJobStatus.CANCELLED]: "Geração cancelada.",
};

export function generationStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status as GenerationJobStatus] ?? "Acompanhando a geração…"
  );
}

/** Mensagem acionável por tipo de erro do provedor (o `errorCode` do job). */
const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT:
    "O provedor de IA atingiu o limite de pedidos por minuto. Tente novamente em instantes.",
  QUOTA: "A cota do provedor de IA acabou. Avise a administração.",
  TIMEOUT: "O provedor de IA demorou demais para responder. Tente novamente.",
  SERVER:
    "O provedor de IA está com problemas no momento. Tente novamente mais tarde.",
  NETWORK:
    "Não foi possível falar com o provedor de IA (rede). Tente novamente.",
  AUTHENTICATION:
    "A chave do provedor de IA é inválida ou foi revogada. Avise a administração.",
  SAFETY:
    "O provedor recusou o pedido por segurança. Ajuste as instruções e tente de novo.",
  SCHEMA:
    "A resposta da IA não veio no formato esperado. Tente gerar novamente.",
  NOT_FOUND_MODEL:
    "O modelo de IA configurado não existe ou não está disponível. Avise a administração.",
  CONTEXT_LENGTH:
    "O pedido ficou grande demais para o modelo. Reduza as instruções ou o contexto.",
  INVALID_REQUEST:
    "O provedor recusou o pedido (parâmetros inválidos). Avise a administração.",
};

export function generationErrorMessage(
  job: Pick<ContentGenerationJobResponse, "errorCode"> | null,
): string {
  return (
    (job?.errorCode && ERROR_MESSAGES[job.errorCode]) ||
    "Não foi possível gerar o conteúdo desta etapa."
  );
}

/** Andamento de imagens de um job (`null` se o job é de texto ou ainda não tem andamento). */
export function imageProgressOf(job: Pick<ContentGenerationJobResponse, "progress"> | null | undefined): ImageJobProgress | null {
  return job?.progress?.phase === "IMAGES" ? job.progress : null;
}

/**
 * Outra etapa da mesma categoria (faixa etária) já está gerando? O Estúdio só roda uma geração por categoria,
 * então o botão "Gerar" das demais espera a atual terminar. A API é quem garante; isto só evita o clique em vão.
 */
export function isCategoryBusy(
  stages: ReadonlyArray<{ id: string; status: ContentStageStatus }>,
  currentStageId: string,
  jobs: Readonly<Record<string, Pick<ContentGenerationJobResponse, "status"> | undefined>>,
): boolean {
  return stages.some(
    (other) =>
      other.id !== currentStageId && (other.status === ContentStageStatus.GENERATING || isGenerationActive(jobs[other.id] ?? null)),
  );
}

/**
 * A etapa está trabalhando? Vale o status dela, qualquer job ativo (texto OU imagens: durante as imagens a etapa fica em
 * rascunho) e a ponte entre o texto concluído e o início das imagens. O painel de progresso só some quando tudo acabou.
 */
export function isStageWorking(
  stage: { status: ContentStageStatus },
  job: Pick<ContentGenerationJobResponse, "status"> | null | undefined,
  awaitingImages: boolean,
): boolean {
  return stage.status === ContentStageStatus.GENERATING || isGenerationActive(job ?? null) || awaitingImages;
}

/** Job que o painel de progresso desenha: na ponte (texto pronto, imagens ainda na fila) vira um job de imagens "na fila". */
export function progressJobFor(job: ContentGenerationJobResponse | null | undefined, awaitingImages: boolean): ContentGenerationJobResponse | null {
  if (!job) return null;
  if (!awaitingImages || isGenerationActive(job)) return job;
  return { ...job, status: GenerationJobStatus.PENDING, capability: AiGenerationCapability.IMAGE_GENERATION, progress: null, attempts: 0 };
}

/** Texto do erro ao pedir uma geração: o aviso de capacidade vem pronto da API; o resto cai no texto padrão. */
export function generationRequestErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorCode(error) === GENERATION_CAPACITY_ERROR_CODE ? getErrorMessage(error, fallback) : fallback;
}
