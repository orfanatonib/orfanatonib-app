import { describe, expect, it } from "vitest";

import { digitsOnly, formatDateBR, maskCEP, maskDateBR, maskPhoneBR } from "./masks";

describe("digitsOnly", () => {
  it.each([["(92) 98155-3139", "92981553139"], ["abc", ""], [null, ""], [undefined, ""], [123, "123"], [0, "0"]])(
    "%s → %s",
    (input, expected) => expect(digitsOnly(input)).toBe(expected),
  );
});

describe("maskDateBR", () => {
  it.each([
    ["", ""], ["1", "1"], ["12", "12"], ["123", "12/3"], ["1234", "12/34"], ["12345", "12/34/5"],
    ["12345678", "12/34/5678"], ["1234567890", "12/34/5678"], ["12/34/5678", "12/34/5678"], ["ab12cd", "12"],
  ])("%s → %s", (input, expected) => expect(maskDateBR(input)).toBe(expected));
});

describe("formatDateBR", () => {
  it("converte ISO puro e preserva o resto", () => {
    expect(formatDateBR("2026-09-01")).toBe("01/09/2026");
    expect(formatDateBR("01/09/2026")).toBe("01/09/2026");
    expect(formatDateBR(" 2026-09-01 ")).toBe("01/09/2026");
    expect(formatDateBR(null)).toBe("");
    expect(formatDateBR("")).toBe("");
  });
});

describe("maskCEP", () => {
  it.each([["", ""], ["12345", "12345"], ["123456", "12345-6"], ["12345678", "12345-678"], ["12.345-678x9", "12345-678"]])(
    "%s → %s",
    (input, expected) => expect(maskCEP(input)).toBe(expected),
  );
});

describe("maskPhoneBR", () => {
  it.each([
    ["", ""], ["9", "(9"], ["92", "(92"], ["929", "(92) 9"], ["9298155", "(92) 9815-5"],
    ["92981553139", "(92) 98155-3139"], ["9232345678", "(92) 3234-5678"],
    ["5592981553139", "+55 (92) 98155-3139"], ["559232345678", "+55 (92) 3234-5678"],
  ])("%s → %s", (input, expected) => expect(maskPhoneBR(input)).toBe(expected));
});
