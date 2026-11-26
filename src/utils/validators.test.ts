import { describe, expect, it } from "vitest";

import { EMAIL_REGEX, isValidEmail, normalizeEmail } from "./validators";

describe("e-mail", () => {
  it("normaliza espaços e caixa", () => {
    expect(normalizeEmail("  Ana@Exemplo.COM ")).toBe("ana@exemplo.com");
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });

  it.each([
    ["ana@exemplo.com", true], ["  ANA@exemplo.com.br ", true], ["a.b+c@x.co", true],
    ["ana@exemplo", false], ["ana exemplo@x.com", false], ["@x.com", false], ["ana@.com", false], ["", false], [null, false], [123, false],
  ])("isValidEmail(%s) = %s", (input, expected) => expect(isValidEmail(input)).toBe(expected));

  it("EMAIL_REGEX exige um ponto depois do @", () => {
    expect(EMAIL_REGEX.test("a@b.c")).toBe(true);
    expect(EMAIL_REGEX.test("a@b")).toBe(false);
  });
});
