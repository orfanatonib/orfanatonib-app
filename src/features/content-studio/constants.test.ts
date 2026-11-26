import { describe, expect, it } from "vitest";

import { CONTENT_PACKAGE_STATUS_LABELS, CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "./constants";
import { ContentPackageStatus, ContentStageStatus, ContentStageType } from "./types";

describe("rótulos do Estúdio", () => {
  it("todo estado de pacote, de etapa e todo tipo de etapa tem rótulo", () => {
    for (const s of Object.values(ContentPackageStatus)) expect(CONTENT_PACKAGE_STATUS_LABELS[s]).toBeTruthy();
    for (const s of Object.values(ContentStageStatus)) expect(CONTENT_STAGE_STATUS_LABELS[s]).toBeTruthy();
    for (const t of Object.values(ContentStageType)) expect(CONTENT_STAGE_TYPE_LABELS[t]).toBeTruthy();
  });
});
