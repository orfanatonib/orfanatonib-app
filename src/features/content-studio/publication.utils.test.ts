import { describe, expect, it } from "vitest";

import { ContentPackageStatus, ContentPublicationStatus, PublicationPhase, type ContentPublicationResponse } from "./types";
import { canPublishPackage, newPublicationKey, publicationPageUrl, publicationStateFrom } from "./publication.utils";

const base: ContentPublicationResponse = {
  id: "1",
  packageId: "p",
  status: ContentPublicationStatus.PUBLISHED,
  targetType: "VISIT_MATERIAL_PAGE",
  visitMaterialPageId: "pg",
  audiences: null,
  visitMaterialPagePath: "materiais_visita_x",
  publishedAt: null,
  errorCode: null,
  errorMessage: null,
  createdAt: "",
};

describe("publication.utils", () => {
  it("mostra o botão quando há categoria aprovada para publicar e a flag está ligada, qualquer que seja o status do pacote", () => {
    for (const status of [
      ContentPackageStatus.READY_FOR_PUBLICATION,
      ContentPackageStatus.IN_PROGRESS,
      ContentPackageStatus.PACKAGE_READY,
      ContentPackageStatus.IN_REVIEW,
      ContentPackageStatus.CHANGES_REQUESTED,
    ])
      expect(canPublishPackage(status, true, 1), status).toBe(true);
    expect(canPublishPackage(ContentPackageStatus.READY_FOR_PUBLICATION, false, 1)).toBe(false);
  });

  it("sem categoria para publicar, ou com o material publicando/publicado/arquivado, não mostra", () => {
    expect(canPublishPackage(ContentPackageStatus.READY_FOR_PUBLICATION, true, 0)).toBe(false);
    for (const status of [ContentPackageStatus.PUBLISHING, ContentPackageStatus.PUBLISHED, ContentPackageStatus.ARCHIVED])
      expect(canPublishPackage(status, true, 2), status).toBe(false);
  });

  it("gera chaves únicas e dentro do limite de 191 caracteres", () => {
    const a = newPublicationKey();
    expect(a).not.toBe(newPublicationKey());
    expect(a.length).toBeLessThanOrEqual(191);
  });

  it("monta a URL pública na raiz", () => {
    expect(publicationPageUrl("materiais_visita_x")).toBe("/materiais_visita_x");
    expect(publicationPageUrl("/materiais_visita_x")).toBe("/materiais_visita_x");
    expect(publicationPageUrl(null)).toBeNull();
  });

  it("traduz o status da publicação", () => {
    expect(publicationStateFrom(base).phase).toBe(PublicationPhase.PUBLISHED);
    const failed = publicationStateFrom({ ...base, status: ContentPublicationStatus.FAILED, errorMessage: "Falhou X" });
    expect(failed).toMatchObject({ phase: PublicationPhase.FAILED, message: "Falhou X" });
    expect(publicationStateFrom({ ...base, status: ContentPublicationStatus.UNCERTAIN }).phase).toBe(PublicationPhase.FAILED);
    expect(publicationStateFrom({ ...base, status: ContentPublicationStatus.PUBLISHING }).phase).toBe(PublicationPhase.PUBLISHING);
  });
});
