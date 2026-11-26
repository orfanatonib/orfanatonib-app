/**
 * Status de cada listagem. O status do PACOTE é um só; cada tela tem o seu ponto de vista e deriva o próprio status
 * das categorias (faixas etárias): a produção fala do que falta produzir/enviar, a revisão fala do que falta decidir.
 */

/** Onde o material está do ponto de vista de quem PRODUZ (listagem de Produção). */
export enum ProductionListStatus {
  /** Nada foi produzido ainda. */
  NOT_STARTED = "NOT_STARTED",
  /** Há conteúdo, nenhuma categoria está pronta para enviar. */
  IN_PRODUCTION = "IN_PRODUCTION",
  /** Ao menos uma categoria tem as etapas concluídas e nenhuma foi enviada. */
  READY_TO_SEND = "READY_TO_SEND",
  /** Parte das categorias foi para a revisão, outras ainda estão na produção. */
  PARTIALLY_SENT = "PARTIALLY_SENT",
  /** Todas as categorias que faltam publicar foram enviadas e aguardam a revisão. */
  ALL_SENT = "ALL_SENT",
  /** A revisão devolveu alguma etapa com ajustes. */
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  /** Algumas categorias já estão em Materiais de Visita, outras ainda faltam produzir e enviar. */
  PARTIALLY_PUBLISHED = "PARTIALLY_PUBLISHED",
  /** Todas as categorias estão em Materiais de Visita. */
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

/** Onde o material está do ponto de vista de quem REVISA (listagem de Revisão). */
export enum ReviewListStatus {
  /** Foi enviado, mas o revisor ainda não decidiu nada. */
  AWAITING = "AWAITING",
  /** O revisor já decidiu parte e ainda há etapas esperando por ele. */
  IN_PROGRESS = "IN_PROGRESS",
  /** Não há mais o que decidir: o que não foi aprovado voltou à produção com ajustes. */
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  /** Tudo o que foi enviado está aprovado e falta publicar. */
  READY_TO_PUBLISH = "READY_TO_PUBLISH",
  PUBLISHING = "PUBLISHING",
  /** Todas as categorias estão em Materiais de Visita. */
  PUBLISHED = "PUBLISHED",
  /** Nenhuma categoria foi enviada para revisão (não deveria estar na fila). */
  NOT_SENT = "NOT_SENT",
}

export type ListChipColor = "default" | "primary" | "info" | "warning" | "success" | "error";

/** Como um status aparece no cartão: a etiqueta e o botão principal. */
export interface ListStatusView {
  /** Etiqueta (badge) do cartão. */
  label: string;
  color: ListChipColor;
  /** Texto do botão principal. */
  action: string;
  actionColor: "primary" | "info" | "error" | "warning" | "success" | "inherit";
  actionVariant: "contained" | "outlined";
}
