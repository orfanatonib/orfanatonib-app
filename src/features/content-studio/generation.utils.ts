import type { ContentGenerationJobResponse } from "./types";

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
