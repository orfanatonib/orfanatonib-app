import { describe, expect, it } from "vitest";
import { slugify } from "./ErrorScreen.utils";

describe("slugify", () => {
  it.each([
    ["Tentar novamente", "tentar-novamente"],
    ["Página inicial", "pagina-inicial"],
    ["  Voltar!  ", "voltar"],
  ])("%s -> %s", (input, expected) => expect(slugify(input)).toBe(expected));
});
