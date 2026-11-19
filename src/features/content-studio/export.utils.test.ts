import { describe, expect, it } from "vitest";

import { exportFileName } from "./export.utils";
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
