import { describe, expect, it } from "vitest";

import { PageTemplateType } from "./types";
import { getTemplateOptionByKey } from "./utils";

describe("getTemplateOptionByKey", () => {
  it("devolve o modelo do tipo pedido", () => {
    expect(getTemplateOptionByKey(PageTemplateType.GALLERY)?.title).toBe("Galeria de Fotos");
  });

  it("chave vazia (nada escolhido) não tem modelo", () => {
    expect(getTemplateOptionByKey("")).toBeNull();
  });

  it("chave desconhecida também não", () => {
    expect(getTemplateOptionByKey("OUTRO" as PageTemplateType)).toBeNull();
  });
});
