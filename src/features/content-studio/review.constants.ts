import { TrackReviewState } from "./workspace.utils";

export const TRACK_REVIEW_STATE_LABELS: Record<TrackReviewState, string> = {
  [TrackReviewState.IN_PRODUCTION]: "Em produção",
  [TrackReviewState.READY_TO_SUBMIT]: "Pronta para enviar",
  [TrackReviewState.IN_REVIEW]: "Em revisão",
  [TrackReviewState.CHANGES_REQUESTED]: "Ajustes solicitados",
  [TrackReviewState.APPROVED]: "Aprovada",
};

export const TRACK_REVIEW_STATE_COLORS: Record<TrackReviewState, "default" | "info" | "warning" | "success"> = {
  [TrackReviewState.IN_PRODUCTION]: "default",
  [TrackReviewState.READY_TO_SUBMIT]: "info",
  [TrackReviewState.IN_REVIEW]: "warning",
  [TrackReviewState.CHANGES_REQUESTED]: "warning",
  [TrackReviewState.APPROVED]: "success",
};

export const SEND_REVIEW_TEXTS = {
  /** Botão da categoria (a ação normal) e o botão geral (só quando tudo está pronto). */
  sendCategory: "Enviar esta categoria para revisão",
  sendAll: "Enviar tudo para revisão",
  title: (names: string): string => `Enviar ${names} para revisão?`,
  titleAll: "Enviar tudo para revisão?",
  intro: "Vai para a revisão:",
  allIntro: "Vão para a revisão todas as categorias prontas:",
  effect: "Enquanto estiver em revisão, o conteúdo não pode ser editado aqui. As outras categorias não mudam.",
  cancel: "Cancelar",
  confirm: "Enviar para revisão",
  categoryReadyNotice: (name: string): string =>
    `Todos os itens de ${name} estão concluídos. A categoria só vai para a revisão quando você enviar.`,
} as const;
