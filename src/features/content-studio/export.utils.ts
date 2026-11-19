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
