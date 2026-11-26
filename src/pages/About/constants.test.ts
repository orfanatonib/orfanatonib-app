import { describe, expect, it } from "vitest";

import { ABOUT_SECTIONS } from "./constants";

describe("seções da página Sobre", () => {
  it("ids únicos e conteúdo presente", () => {
    const ids = ABOUT_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of ABOUT_SECTIONS) {
      expect(section.title.trim()).not.toBe("");
      expect(section.content.trim().length).toBeGreaterThan(40);
    }
  });

  it("exatamente uma seção principal, a primeira", () => {
    const main = ABOUT_SECTIONS.filter((s) => s.isMain);
    expect(main).toHaveLength(1);
    expect(ABOUT_SECTIONS[0].isMain).toBe(true);
  });
});
