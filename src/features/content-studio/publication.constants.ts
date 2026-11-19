import { PublicationPhase, PublicationTestament, type PublicationState } from "./types";

/** A publicação gera DOCX e PDF (LibreOffice) e envia arquivos: pode passar do tempo padrão do cliente. */
export const PUBLISH_REQUEST_TIMEOUT_MS = 180_000;

export const INITIAL_PUBLICATION_STATE: PublicationState = {
  phase: PublicationPhase.IDLE,
  publication: null,
  message: null,
};

export const PUBLICATION_TESTAMENT_OPTIONS: ReadonlyArray<{ value: PublicationTestament; label: string }> = [
  { value: PublicationTestament.OLD_TESTAMENT, label: "Antigo Testamento" },
  { value: PublicationTestament.NEW_TESTAMENT, label: "Novo Testamento" },
];

export const PUBLICATION_TEXTS = {
  BUTTON: "Publicar no site",
  BUTTON_PUBLISHING: "Publicando…",
  DIALOG_TITLE: "Publicar no site?",
  DIALOG_WARNING:
    "Vamos criar uma página em Materiais para Visita com o tema, as referências e o objetivo do material, e anexar os documentos (DOCX e PDF) gerados das versões aprovadas. A página fica pública para quem tiver o link.",
  TESTAMENT_LABEL: "Testamento da página",
  CANCEL: "Cancelar",
  CONFIRM: "Publicar",
  SUCCESS: "Material publicado no site.",
  OPEN_PAGE: "Ver página publicada",
  PUBLISHED_NOTICE: "Este material está publicado no site.",
  FAILED_FALLBACK: "Não foi possível publicar o material. Nada foi publicado; tente novamente.",
  UNCERTAIN:
    "A publicação terminou de forma incerta. Clique em publicar de novo para conferir: se a página já existir, ela será reaproveitada.",
  REQUEST_FAILED: "Não foi possível publicar o material agora. Tente novamente.",
} as const;
