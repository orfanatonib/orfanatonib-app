import { describe, expect, it } from "vitest";

import { isEntryOptionVisible } from "./entryOptions";

describe("isEntryOptionVisible", () => {
  it("flag ligada aparece", () => {
    expect(isEntryOptionVisible(true, true)).toBe(true);
  });

  it("flag desligada some depois de as flags chegarem", () => {
    expect(isEntryOptionVisible(false, true)).toBe(false);
  });

  it("antes de as flags chegarem não esconde nada", () => {
    expect(isEntryOptionVisible(false, false)).toBe(true);
  });
});
