import { TrackReviewState } from "./workspace.utils";

export const TRACK_REVIEW_STATE_LABELS: Record<TrackReviewState, string> = {
  [TrackReviewState.IN_PRODUCTION]: "Em produção",
  [TrackReviewState.READY_TO_SUBMIT]: "Pronta para revisão",
  [TrackReviewState.IN_REVIEW]: "Em revisão",
  [TrackReviewState.CHANGES_REQUESTED]: "Ajustes solicitados",
  [TrackReviewState.APPROVED]: "Aprovada",
};

export const TRACK_REVIEW_STATE_COLORS: Record<
  TrackReviewState,
  "default" | "info" | "warning" | "success"
> = {
  [TrackReviewState.IN_PRODUCTION]: "default",
  [TrackReviewState.READY_TO_SUBMIT]: "info",
  [TrackReviewState.IN_REVIEW]: "warning",
  [TrackReviewState.CHANGES_REQUESTED]: "warning",
  [TrackReviewState.APPROVED]: "success",
};

export const SUBMIT_REVIEW_TEXTS = {
  open: "Enviar para revisão",
  title: "Enviar para revisão",
  intro:
    "Escolha quais categorias seguem para a revisão agora. As demais continuam em produção e podem ser enviadas depois.",
  all: "Todas as categorias prontas",
  notReady: "Ainda há etapas a concluir",
  confirm: "Enviar selecionadas",
  confirmAll: "Enviar todas as prontas",
  cancel: "Cancelar",
  none: "Nenhuma categoria pronta: conclua todas as etapas de ao menos uma categoria.",
} as const;
