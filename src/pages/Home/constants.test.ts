import { describe, expect, it } from "vitest";

import { FEATURES } from "./constants";

describe("recursos da Home", () => {
  it("cada recurso tem título, descrição e ícone, e os títulos não se repetem", () => {
    expect(FEATURES.length).toBeGreaterThan(0);
    for (const feature of FEATURES) {
      expect(feature.title).toBeTruthy();
      expect(feature.description).toBeTruthy();
    }
    const titles = FEATURES.map((feature) => feature.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
