import { describe, expect, it } from "vitest";

import {
  VISIT_MATERIAL_CURRENT_ENDPOINT,
  VISIT_MATERIAL_ENDPOINT,
  VISIT_MATERIAL_TAB_LABELS,
  VISIT_MATERIAL_TAB_MOBILE_LABELS,
  VISIT_MATERIAL_TESTAMENT_LABELS,
} from "./constants";
import { TestamentType, VisitMaterialListTab } from "./types";

describe("constantes de materiais de visita", () => {
  it("o endpoint do material da semana é sub-rota do endpoint principal", () => {
    expect(VISIT_MATERIAL_CURRENT_ENDPOINT).toBe(`${VISIT_MATERIAL_ENDPOINT}/current-material`);
  });

  it("todo testamento e toda aba têm rótulo (desktop e mobile)", () => {
    for (const t of Object.values(TestamentType)) expect(VISIT_MATERIAL_TESTAMENT_LABELS[t]).toBeTruthy();
    for (const tab of Object.values(VisitMaterialListTab)) {
      expect(VISIT_MATERIAL_TAB_LABELS[tab]).toBeTruthy();
      expect(VISIT_MATERIAL_TAB_MOBILE_LABELS[tab]).toBeTruthy();
    }
  });
});
