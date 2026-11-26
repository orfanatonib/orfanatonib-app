import { describe, expect, it } from "vitest";

import { canEmbedPdf, exportFileName } from "./export.utils";
import { ExportFormat } from "./types";

describe("exportFileName", () => {
  it("tira acento, espaço e símbolo e põe a extensão", () => {
    expect(exportFileName(["Esperança & Fé", "Crianças"], ExportFormat.PDF)).toBe("esperanca-fe-criancas.pdf");
  });
  it("sem nada aproveitável usa o nome padrão e limita o tamanho", () => {
    expect(exportFileName(["***"], ExportFormat.DOCX)).toBe("material-para-visita.docx");
    expect(exportFileName(["a".repeat(200)], ExportFormat.PDF).length).toBeLessThanOrEqual(84);
  });
});

describe("canEmbedPdf", () => {
  it("só embute em tela larga e com visualizador de PDF", () => {
    expect(canEmbedPdf(true, false)).toBe(true);
    expect(canEmbedPdf(undefined, false)).toBe(true);
    expect(canEmbedPdf(false, false)).toBe(false);
    expect(canEmbedPdf(true, true)).toBe(false);
  });
});
