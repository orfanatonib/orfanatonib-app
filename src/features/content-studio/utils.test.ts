import { describe, expect, it } from "vitest";

import { formatAudienceAgeRange, formatContentStudioDateTime } from "./utils";

describe("utils do Estúdio", () => {
  it("faixa etária: aberta no teto vira 'a partir de'", () => {
    expect(formatAudienceAgeRange({ minimumAge: 0, maximumAge: 3 } as never)).toBe("0 a 3 anos");
    expect(formatAudienceAgeRange({ minimumAge: 18, maximumAge: null } as never)).toBe("A partir de 18 anos");
  });

  it("data e hora no formato brasileiro", () => {
    expect(formatContentStudioDateTime("2026-01-05T15:30:00")).toMatch(/05\/01\/2026,? 15:30/);
  });
});
