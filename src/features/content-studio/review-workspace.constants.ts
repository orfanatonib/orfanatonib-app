import { ContentPackageStatus, ContentStageStatus } from "./types";

/** Cor da etiqueta da etapa na revisão (aprovada é o estado comum: na aba ela vira só um ícone). */
export const REVIEW_STAGE_STATUS_COLORS: Partial<Record<ContentStageStatus, "warning" | "success" | "error">> = {
  [ContentStageStatus.IN_REVIEW]: "warning",
  [ContentStageStatus.APPROVED]: "success",
  [ContentStageStatus.CHANGES_REQUESTED]: "error",
};

/** Rota da tela de revisão de um material (a fila fica em `/adm/estudio/revisao`). */
export const REVIEW_ROUTES = {
  queue: "/adm/estudio/revisao",
  /** Destino depois de aprovar e publicar: a lista das páginas de materiais para visita. */
  visitMaterialPages: "/adm/paginas-materiais-visita",
} as const;

export const reviewPackagePath = (packageId: string): string => `${REVIEW_ROUTES.queue}/${packageId}`;

/** Parâmetros da URL da revisão: a categoria e a etapa abertas (o link recarregado volta ao mesmo lugar). */
export const REVIEW_QUERY = { audience: "audience", stage: "stage" } as const;

/**
 * Etapa liberada para revisão: a produção a enviou e ela está (ou esteve) nas mãos do revisor. Etapas ainda em
 * produção NÃO aparecem na revisão.
 */
export const RELEASED_STAGE_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.IN_REVIEW,
  ContentStageStatus.APPROVED,
  ContentStageStatus.CHANGES_REQUESTED,
];

/**
 * Situações do material em que NÃO há mais decisão (as mesmas do servidor). As demais (inclusive `IN_PROGRESS`, que o
 * material assume quando uma categoria volta à produção) deixam decidir: quem manda é o estado de cada item.
 */
export const REVIEW_DECISION_CLOSED_PACKAGE_STATUSES: readonly ContentPackageStatus[] = [
  ContentPackageStatus.DRAFT,
  ContentPackageStatus.PUBLISHING,
  ContentPackageStatus.PUBLISHED,
  ContentPackageStatus.ARCHIVED,
];

/** Tamanho máximo do comentário de ajuste (o mesmo limite do servidor para mensagens de revisão). */
export const REVIEW_NOTE_MAX_LENGTH = 2000;

export const REVIEW_NOTES_STORAGE_PREFIX = "content-studio:review-notes:";

export const REVIEW_WORKSPACE_TEXTS = {
  back: "Voltar para a lista de Revisão",
  loadError: "Não foi possível carregar este material para revisão.",
  notFoundTitle: "Nada liberado para revisão",
  notFoundBody: "A produção ainda não enviou nenhuma categoria deste material para revisão.",
  decisionTitle: "Sua decisão sobre este item",
  noDecisionTitle: "Sem decisão pendente",
  decisionHint: "Aprove o item ou descreva o ajuste e devolva-o para a produção.",
  feedbackLabel: "Ajuste necessário",
  feedbackPlaceholder: "Ex.: Deixar o primeiro parágrafo mais curto e simples.",
  feedbackNeeded: "Escreva o ajuste para poder devolver o item.",
  approve: "Aprovar este item",
  approved: "Item aprovado",
  approveCategory: "Aprovar esta categoria",
  requestChanges: "Devolver com ajustes",
  nextPending: "Ir para o próximo item pendente",
  checklistTitle: "O que conferir antes de aprovar",
  historyTitle: "Observações do revisor",
  versionChanged: "Este item recebeu uma nova versão enquanto estava aberta. O conteúdo abaixo já é o atual: releia antes de decidir.",
  acknowledge: "Revisei a versão atual",
  recoveredNotes: "Recuperamos observações que você escreveu e não enviou.",
  publishHint: "A publicação libera quando todas as categorias enviadas forem aprovadas.",
  allApproved: "Todos os itens liberados foram aprovados.",
  approveAll: "Aprovar tudo",
  approveAllTitle: "Aprovar tudo e publicar?",
  approveAllBody:
    "Aprova todos os itens de todas as categorias que esperam a sua decisão e abre a publicação em Materiais de Visita. Confirme que você revisou o conteúdo e que está tudo certo.",
  approveAllConfirm: "Aprovar tudo",
  approveAllCancel: "Cancelar",
  approveAllBlocked: "Releia os itens que receberam uma nova versão antes de aprovar.",
  approveCategoryTitle: (name: string): string => `Aprovar toda a categoria ${name}?`,
  approveCategoryBody:
    "Aprova todos os itens desta categoria que esperam a sua decisão. As outras categorias não mudam. Confirme que você revisou o conteúdo e que está tudo certo.",
  approveCategoryConfirm: "Aprovar categoria",
  published: "Publicada",
  pending: "Pendente de revisão",
} as const;

export const REVIEW_BLOCK_REASONS = {
  disabled: "A revisão está desativada neste ambiente.",
  packageClosed: "Este material já está pronto ou publicado: não há decisão pendente.",
  trackPublished: "Esta categoria já foi publicada em Materiais de Visita e não pode mais ser alterada.",
  approved: "Este item já foi aprovado.",
  returned: "Este item voltou para a produção. Ele volta para você quando a produção o enviar de novo.",
  notReleased: "Este item ainda não foi liberado para revisão.",
  noVersion: "Este item não tem uma versão para decidir.",
  versionChanged: "Confirme que releu a versão atual para poder decidir.",
} as const;

export const HTTP_STATUS_CONFLICT = 409;

/** Identificador de "ocupado" da ação em lote (aprovar tudo): nenhuma etapa isolada fica livre enquanto ela roda. */
export const BULK_BUSY_ID = "bulk-approve";

export const REVIEW_FEEDBACK_TEXTS = {
  approvedAll: (count: number): string => `${count} ${count === 1 ? "item aprovado" : "itens aprovados"}.`,
  approved: "Item aprovado.",
  returned: "Item devolvido para a produção com o seu ajuste.",
  approveFailed: "Não foi possível aprovar este item.",
  returnFailed: "Não foi possível devolver este item.",
  resolveFailed: "Não foi possível marcar a observação como resolvida.",
  stale: "Este item mudou enquanto você revisava. Atualizamos a tela: releia a versão atual antes de decidir.",
  needNote: "Escreva o ajuste necessário antes de devolver o item.",
} as const;
