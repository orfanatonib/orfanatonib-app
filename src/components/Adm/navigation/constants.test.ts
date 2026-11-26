import { describe, expect, it } from "vitest";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import { ADMIN_NAVIGATION_SECTIONS } from "./constants";

const items = ADMIN_NAVIGATION_SECTIONS.flatMap((section) => section.items);

describe("catálogo do menu administrativo", () => {
  it("ids, caminhos e rótulos são únicos", () => {
    for (const key of ["id", "path", "label"] as const) {
      const values = items.map((item) => item[key]);
      expect(new Set(values).size, `${key} duplicado`).toBe(values.length);
    }
  });

  it("todo caminho é uma rota /adm e todo item tem papel permitido", () => {
    for (const item of items) {
      expect(item.path.startsWith("/adm/") || item.path === "/adm").toBe(true);
      expect(item.allowedRoles.length, item.id).toBeGreaterThan(0);
    }
  });

  it("toda flag exigida pelo menu existe no catálogo", () => {
    const known = new Set<string>(Object.values(FeatureFlagKeys));
    for (const item of items) {
      for (const flag of [
        item.requiredFeatureFlag,
        ...(item.requiredFeatureFlags ?? []),
      ]) {
        if (flag) expect(known.has(flag), `${item.id}: ${flag}`).toBe(true);
      }
    }
  });

  it("cada seção tem título, ícone e ao menos um item", () => {
    for (const section of ADMIN_NAVIGATION_SECTIONS) {
      expect(section.title).toBeTruthy();
      expect(section.icon).toBeTruthy();
      expect(section.items.length, section.id).toBeGreaterThan(0);
    }
  });
});
