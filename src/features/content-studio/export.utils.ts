import type { ExportFormat } from "./types";

/** Nome de arquivo seguro para o download (sem acento, espaço nem símbolo). */
export function exportFileName(parts: readonly string[], format: ExportFormat): string {
  const slug = parts
    .join("-")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slug || "material-para-visita"}.${format}`;
}

/**
 * O PDF pode aparecer dentro da página (iframe)? Só em tela larga e com visualizador de PDF no navegador:
 * no celular (Android e iOS) o iframe de PDF fica em branco ou mostra só a primeira página, então a tela
 * oferece "Abrir PDF" no visualizador do aparelho.
 */
export function canEmbedPdf(pdfViewerEnabled: boolean | undefined, compactScreen: boolean): boolean {
  return pdfViewerEnabled !== false && !compactScreen;
}
