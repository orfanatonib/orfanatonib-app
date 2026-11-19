import { describe, expect, it } from "vitest";

import { isStudioRoot, studioRouteMeta } from "./shell.utils";

describe("cabeçalho do Estúdio por rota", () => {
  it("cada tela tem o seu título e a volta certa", () => {
    expect(studioRouteMeta("/adm/estudio").title).toBe("Estúdio Orfanato");
    expect(studioRouteMeta("/adm/estudio").backTo).toBeUndefined();
    expect(studioRouteMeta("/adm/estudio/producao")).toMatchObject({ title: "Materiais para visita", backTo: "/adm/estudio" });
    expect(studioRouteMeta("/adm/estudio/revisao").title).toBe("Revisão editorial");
    expect(studioRouteMeta("/adm/estudio/orientacoes").title).toBe("Orientações de criação");
  });
  it("o material abre voltando para a lista, não para a visão geral", () => {
    expect(studioRouteMeta("/adm/estudio/pacotes/abc-123")).toMatchObject({ title: "Material para visita", backTo: "/adm/estudio/producao", backLabel: "Voltar aos materiais" });
  });
  it("barra final e rota desconhecida não quebram", () => {
    expect(studioRouteMeta("/adm/estudio/")).toMatchObject({ title: "Estúdio Orfanato" });
    expect(studioRouteMeta("/adm/estudio/xyz").title).toBe("Estúdio Orfanato");
    expect(isStudioRoot("/adm/estudio/")).toBe(true);
    expect(isStudioRoot("/adm/estudio/producao")).toBe(false);
  });
});
