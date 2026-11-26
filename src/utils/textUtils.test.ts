import { describe, expect, it } from "vitest";

import { anchorProps, initials, isCoreOrSensitive, normalize, normalizeName, roleChipColor } from "./textUtils";

describe("normalizeName", () => {
  it.each([
    ["JOÃO DA SILVA", "João Da Silva"], ["  maria   souza ", "Maria Souza"], ["", ""], [null, ""], [undefined, ""],
  ])("%s → %s", (input, expected) => expect(normalizeName(input)).toBe(expected));
});

describe("normalize (busca sem acento nem caixa)", () => {
  it("remove acentos e baixa a caixa", () => {
    expect(normalize("São JOSÉ")).toBe("sao jose");
    expect(normalize(null)).toBe("");
  });
});

describe("initials", () => {
  it.each([["Ana Maria Souza", "AM"], ["ana", "A"], ["  ", "?"], [undefined, "?"]])("%s → %s", (input, expected) =>
    expect(initials(input)).toBe(expected),
  );
});

describe("roleChipColor", () => {
  it("mapeia os perfis e cai em default", () => {
    expect(roleChipColor("ADMIN")).toBe("secondary");
    expect(roleChipColor("LEADER")).toBe("primary");
    expect(roleChipColor("MEMBER")).toBe("success");
    expect(roleChipColor("x")).toBe("default");
    expect(roleChipColor(undefined)).toBe("default");
  });
});

describe("anchorProps e campos sensíveis", () => {
  it("link externo seguro", () => {
    expect(anchorProps("https://x.com")).toEqual({ component: "a", href: "https://x.com", target: "_blank", rel: "noopener noreferrer" });
    expect(anchorProps(undefined)).toEqual({});
  });
  it("isCoreOrSensitive", () => {
    for (const k of ["id", "email", "password", "refreshToken", "createdAt"]) expect(isCoreOrSensitive(k)).toBe(true);
    expect(isCoreOrSensitive("bio")).toBe(false);
  });
});
