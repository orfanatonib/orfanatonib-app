import { describe, expect, it } from "vitest";

import {
  ContentPackageStatus,
  ContentPublicationStatus,
  PublicationPhase,
  type ContentPublicationResponse,
} from "./types";
import { canPublishPackage, newPublicationKey, publicationPageUrl, publicationStateFrom } from "./publication.utils";

const base: ContentPublicationResponse = {
  id: "1",
  packageId: "p",
  status: ContentPublicationStatus.PUBLISHED,
  targetType: "VISIT_MATERIAL_PAGE",
  visitMaterialPageId: "pg",
  visitMaterialPagePath: "materiais_visita_x",
  publishedAt: null,
  errorCode: null,
  errorMessage: null,
  createdAt: "",
};

describe("publication.utils", () => {
  it("mostra o botão só com READY_FOR_PUBLICATION e a flag ligada", () => {
    expect(canPublishPackage(ContentPackageStatus.READY_FOR_PUBLICATION, true)).toBe(true);
    expect(canPublishPackage(ContentPackageStatus.READY_FOR_PUBLICATION, false)).toBe(false);
    expect(canPublishPackage(ContentPackageStatus.PUBLISHED, true)).toBe(false);
    expect(canPublishPackage(ContentPackageStatus.IN_REVIEW, true)).toBe(false);
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
    expect(publicationStateFrom({ ...base, status: ContentPublicationStatus.UNCERTAIN }).phase).toBe(
      PublicationPhase.FAILED,
    );
    expect(publicationStateFrom({ ...base, status: ContentPublicationStatus.PUBLISHING }).phase).toBe(
      PublicationPhase.PUBLISHING,
    );
  });
});
