import { PUBLICATION_TEXTS } from "./publication.constants";
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
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `pub-${random}`;
}

/** O botão "Publicar no site" só aparece com o material pronto e a flag de publicação ligada. */
export function canPublishPackage(status: ContentPackageStatus, publicationEnabled: boolean): boolean {
  return publicationEnabled && status === ContentPackageStatus.READY_FOR_PUBLICATION;
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
