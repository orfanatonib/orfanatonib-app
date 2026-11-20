import { ProductionListStatus, ReviewListStatus, type ListStatusView } from "./package-list-status.types";

/**
 * Listagem de PRODUÇÃO: nunca fala em "revisar" (revisar é da outra tela). Quando só parte das categorias foi para a
 * revisão, o material continua sendo da produção: "Continuar produção".
 */
export const PRODUCTION_LIST_STATUS_VIEWS: Readonly<Record<ProductionListStatus, ListStatusView>> = {
  [ProductionListStatus.NOT_STARTED]: {
    label: "Rascunho",
    color: "default",
    action: "Começar produção",
    actionColor: "primary",
    actionVariant: "contained",
  },
  [ProductionListStatus.IN_PRODUCTION]: {
    label: "Em produção",
    color: "primary",
    action: "Continuar produção",
    actionColor: "primary",
    actionVariant: "contained",
  },
  [ProductionListStatus.READY_TO_SEND]: {
    label: "Pronto para enviar",
    color: "info",
    action: "Enviar para revisão",
    actionColor: "primary",
    actionVariant: "contained",
  },
  [ProductionListStatus.PARTIALLY_SENT]: {
    label: "Parte em revisão",
    color: "info",
    action: "Continuar produção",
    actionColor: "primary",
    actionVariant: "contained",
  },
  [ProductionListStatus.ALL_SENT]: {
    label: "Em revisão",
    color: "info",
    action: "Ver material",
    actionColor: "inherit",
    actionVariant: "outlined",
  },
  [ProductionListStatus.CHANGES_REQUESTED]: {
    label: "Ajustes solicitados",
    color: "warning",
    action: "Fazer os ajustes pedidos",
    actionColor: "warning",
    actionVariant: "contained",
  },
  [ProductionListStatus.PARTIALLY_PUBLISHED]: {
    label: "Publicado em parte",
    color: "success",
    action: "Continuar produção",
    actionColor: "primary",
    actionVariant: "contained",
  },
  [ProductionListStatus.PUBLISHED]: {
    label: "Publicado",
    color: "success",
    action: "Ver material",
    actionColor: "success",
    actionVariant: "outlined",
  },
  [ProductionListStatus.ARCHIVED]: {
    label: "Arquivado",
    color: "default",
    action: "Ver material",
    actionColor: "inherit",
    actionVariant: "outlined",
  },
};

/** Listagem de REVISÃO: só aqui existem "Iniciar revisão" e "Continuar revisão". */
export const REVIEW_LIST_STATUS_VIEWS: Readonly<Record<ReviewListStatus, ListStatusView>> = {
  [ReviewListStatus.AWAITING]: {
    label: "Pendente de revisão",
    color: "info",
    action: "Iniciar revisão",
    actionColor: "primary",
    actionVariant: "contained",
  },
  [ReviewListStatus.IN_PROGRESS]: {
    label: "Revisão em andamento",
    color: "info",
    action: "Continuar revisão",
    actionColor: "primary",
    actionVariant: "contained",
  },
  [ReviewListStatus.CHANGES_REQUESTED]: {
    label: "Ajustes solicitados",
    color: "warning",
    action: "Acompanhar ajustes",
    actionColor: "warning",
    actionVariant: "outlined",
  },
  [ReviewListStatus.READY_TO_PUBLISH]: {
    label: "Pronto para publicar",
    color: "success",
    action: "Publicar material",
    actionColor: "success",
    actionVariant: "contained",
  },
  [ReviewListStatus.PUBLISHING]: {
    label: "Publicando",
    color: "info",
    action: "Acompanhar publicação",
    actionColor: "primary",
    actionVariant: "outlined",
  },
  [ReviewListStatus.PUBLISHED]: {
    label: "Publicado",
    color: "success",
    action: "Ver material publicado",
    actionColor: "primary",
    actionVariant: "outlined",
  },
  [ReviewListStatus.NOT_SENT]: {
    label: "Não enviado",
    color: "default",
    action: "Ver material",
    actionColor: "inherit",
    actionVariant: "outlined",
  },
};

/** Etapas que a produção ainda tem de concluir antes de uma categoria poder ir para a revisão. */
export const FAILED_STAGE_ACTION = { label: "Resolver falha na geração", color: "error" } as const;
export const GENERATING_STAGE_ACTION = { label: "Acompanhar geração", color: "info" } as const;
