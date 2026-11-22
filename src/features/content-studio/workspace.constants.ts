import { ContentStageStatus, ContentStageType, ContentPackageStatus, type CreateContentPackagePayload } from "./types";
export const GENERATION_ALLOWED_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.NOT_STARTED,
  ContentStageStatus.DRAFT,
  ContentStageStatus.FAILED,
  ContentStageStatus.STALE,
  ContentStageStatus.CHANGES_REQUESTED,
  // Item concluído pela produção: pode ser gerado de novo; os itens seguintes voltam a ficar desatualizados.
  ContentStageStatus.PRODUCER_APPROVED,
];

/** Itens que já estão com a revisão: enquanto houver um, os itens concluídos da categoria não podem ser gerados de novo. */
export const REVIEW_HELD_STAGE_STATUSES: readonly ContentStageStatus[] = [ContentStageStatus.IN_REVIEW, ContentStageStatus.APPROVED];

export const MANUAL_EDIT_ALLOWED_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.NOT_STARTED,
  ContentStageStatus.GENERATING,
  ContentStageStatus.DRAFT,
  ContentStageStatus.PRODUCER_APPROVED,
  ContentStageStatus.FAILED,
  ContentStageStatus.STALE,
  ContentStageStatus.CHANGES_REQUESTED,
  ContentStageStatus.APPROVED,
];

/** Item enviado para a revisão (esperando decisão) ou já aprovado nela: a produção só vê a Prévia, não edita. */
export const STAGE_PRODUCTION_LOCKED_STATUSES: readonly ContentStageStatus[] = [ContentStageStatus.IN_REVIEW, ContentStageStatus.APPROVED];

export const PACKAGE_PRODUCTION_LOCKED_STATUSES: readonly ContentPackageStatus[] = [
  ContentPackageStatus.PUBLISHING,
  ContentPackageStatus.PUBLISHED,
  ContentPackageStatus.ARCHIVED,
];

export const GENERATION_POLL_MS = 4000;
export const REVISION_INSTRUCTIONS_MAX_LENGTH = 2000;
export const INITIAL_PACKAGE_STATE = {
  contentPackage: null,
  loading: true,
  error: false,
};

export const STUDIO_PAGE_SIZE = 10;
export const EMPTY_STUDIO_FORM: CreateContentPackagePayload = {
  theme: "",
  biblicalReferences: "",
  canonicalObjective: "",
  canonicalNotes: "",
};

/** Aviso quando outra etapa da mesma faixa etária já está sendo gerada (uma geração por categoria). */
export const CATEGORY_IN_REVIEW_MESSAGE =
  "Esta categoria já foi enviada para a revisão. Só um item devolvido pelo revisor pode ser gerado de novo.";
export const CATEGORY_BUSY_MESSAGE =
  "Outra etapa desta faixa etária está sendo gerada agora. O Estúdio gera uma etapa por categoria de cada vez; assim que ela terminar, você pode gerar esta.";

/**
 * Situações do pacote em que NÃO se envia nem se publica mais nada. Todas as outras valem: as categorias são
 * independentes, então quem decide é o estado de cada categoria, não o status do pacote inteiro (que uma edição na
 * produção rebaixa). Espelha `NOT_SUBMITTABLE_PACKAGE_STATUSES` do servidor.
 */
export const PACKAGE_CLOSED_FOR_REVIEW_STATUSES: readonly ContentPackageStatus[] = [
  ContentPackageStatus.PUBLISHING,
  ContentPackageStatus.PUBLISHED,
  ContentPackageStatus.ARCHIVED,
];

/** Etapas com documento E imagem compilada (infográfico): o documento e o PDF ficam no editor; a imagem, junto dele. */
/** Título do bloco de imagens que fecha o documento da fixação e da brincadeira. */
export const FUN_IMAGES_TITLE = {
  FIXATION: "Últimas páginas do documento: folha de instruções e peças do versículo para imprimir (A4 paisagem)",
  GAME_BY_AGE: "Últimas páginas do documento: imagens compiladas, uma por faixa etária (A4 retrato)",
  GAME: "Última página do documento: imagem compilada (A4 retrato)",
  GAME_KIT_BY_AGE: "Últimas páginas do documento: folha de instruções e peças do jogo para imprimir, por faixa etária (A4 paisagem)",
  GAME_KIT: "Últimas páginas do documento: folha de instruções e peças do jogo para imprimir (A4 paisagem)",
} as const;

export const FUN_STAGE_TYPES: readonly ContentStageType[] = [ContentStageType.VERSE_FIXATION, ContentStageType.STANDARD_GAME];

/** Etapas que viram só imagens (carrossel + PDF de imagens), sem documento de texto. */
export const IMAGE_ONLY_STAGE_TYPES: readonly ContentStageType[] = [ContentStageType.LESSON_VISUALS, ContentStageType.VERSE_VISUALS];
