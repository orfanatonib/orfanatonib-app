import { describe, expect, it } from "vitest";

import { PAGE_CREATOR_TEST_IDS, PAGE_TEMPLATE_OPTIONS } from "./constants";
import { PageTemplateType } from "./types";

describe("catálogo de modelos de página", () => {
  it("há um modelo para cada tipo, sem repetição", () => {
    const keys = PAGE_TEMPLATE_OPTIONS.map((o) => o.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(keys)).toEqual(new Set(Object.values(PageTemplateType)));
  });

  it("todo modelo tem texto e o testId segue o prefixo dos cartões", () => {
    for (const option of PAGE_TEMPLATE_OPTIONS) {
      expect(option.title && option.subtitle && option.description).toBeTruthy();
      expect(option.testId.startsWith(PAGE_CREATOR_TEST_IDS.CARD_PREFIX)).toBe(true);
    }
  });

  it("os testIds do criador são únicos", () => {
    const ids = Object.values(PAGE_CREATOR_TEST_IDS);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
