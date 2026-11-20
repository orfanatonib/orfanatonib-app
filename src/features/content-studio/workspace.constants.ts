import { ContentStageStatus, ContentStageType, ContentPackageStatus, type CreateContentPackagePayload } from "./types";
export const GENERATION_ALLOWED_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.NOT_STARTED,
  ContentStageStatus.DRAFT,
  ContentStageStatus.FAILED,
  ContentStageStatus.STALE,
  ContentStageStatus.CHANGES_REQUESTED,
];

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
export const FUN_STAGE_TYPES: readonly ContentStageType[] = [ContentStageType.VERSE_FIXATION, ContentStageType.STANDARD_GAME];

/** Etapas que viram só imagens (carrossel + PDF de imagens), sem documento de texto. */
export const IMAGE_ONLY_STAGE_TYPES: readonly ContentStageType[] = [ContentStageType.LESSON_VISUALS, ContentStageType.VERSE_VISUALS];
