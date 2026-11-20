import { PUBLICATION_TEXTS } from "./publication.constants";
import { PACKAGE_CLOSED_FOR_REVIEW_STATUSES } from "./workspace.constants";
import {
  ContentPackageStatus,
  ContentPublicationStatus,
  PublicationPhase,
  type ContentPublicationResponse,
  type PublicationState,
} from "./types";

/** Chave de idempotência de uma tentativa de publicação (a mesma chave reenviada devolve a mesma publicação). */
export function newPublicationKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `pub-${random}`;
}

/**
 * O botão de publicar aparece quando há categoria aprovada e ainda não publicada (e a flag ligada), qualquer que seja o
 * status do pacote: ele não representa as categorias.
 */
export function canPublishPackage(status: ContentPackageStatus, publicationEnabled: boolean, publishableCount: number): boolean {
  return publicationEnabled && publishableCount > 0 && !PACKAGE_CLOSED_FOR_REVIEW_STATUSES.includes(status);
}

/** URL pública da página: as páginas dinâmicas ficam na raiz do site. */
export function publicationPageUrl(path: string | null): string | null {
  if (!path) return null;
  return `/${path.replace(/^\/+/, "")}`;
}

/** Traduz a resposta da API para o que a tela mostra. */
export function publicationStateFrom(publication: ContentPublicationResponse): PublicationState {
  switch (publication.status) {
    case ContentPublicationStatus.PUBLISHED:
      return { phase: PublicationPhase.PUBLISHED, publication, message: PUBLICATION_TEXTS.SUCCESS };
    case ContentPublicationStatus.FAILED:
      return {
        phase: PublicationPhase.FAILED,
        publication,
        message: publication.errorMessage ?? PUBLICATION_TEXTS.FAILED_FALLBACK,
      };
    case ContentPublicationStatus.UNCERTAIN:
      return { phase: PublicationPhase.FAILED, publication, message: PUBLICATION_TEXTS.UNCERTAIN };
    default:
      return { phase: PublicationPhase.PUBLISHING, publication, message: null };
  }
}
