import type { MediaItem } from "@/store/slices/types";
import { MediaType, MediaUploadType } from "@/store/slices/types";
import { ATENDENTES_LABELS } from "./constants";
import type { AtendenteResponseDto, AtendentePdf, PdfScope } from "./types";

/** Adapta o PDF do antecedente ao modal de pré-visualização de documentos. */
export function pdfToMediaItem(pdf: AtendentePdf, label?: PdfScope | null): MediaItem {
  const displayName =
    label === "estadual"
      ? ATENDENTES_LABELS.ESTADUAL_PDF
      : label === "federal"
        ? ATENDENTES_LABELS.FEDERAL_PDF
        : pdf.originalName ?? pdf.title;
  return {
    id: pdf.id,
    title: displayName,
    description: pdf.description ?? "",
    url: pdf.url ?? "",
    mediaType: (pdf.mediaType as MediaType) || MediaType.DOCUMENT,
    uploadType: (pdf.uploadType as MediaUploadType) || MediaUploadType.UPLOAD,
    isLocalFile: pdf.isLocalFile ?? true,
    platformType: pdf.platformType as MediaItem["platformType"],
    originalName: displayName,
    size: pdf.size,
  };
}

/** Rótulo do vínculo (`Integração FM` / `Usuário`), ou `null` quando o cadastro não tem vínculo. */
export function linkLabelOf(atendente: Pick<AtendenteResponseDto, "attendableType">): string | null {
  if (atendente.attendableType === "integration") return ATENDENTES_LABELS.INTEGRATION_LINK;
  if (atendente.attendableType === "user") return ATENDENTES_LABELS.USER_LINK;
  return null;
}

/** Nome exibido: o do cadastro, o de quem é atendido ou um texto padrão com o início do id do vínculo. */
export function displayNameOf(atendente: AtendenteResponseDto): string {
  if (atendente.name) return atendente.name;
  if (atendente.attendableDisplayName) return atendente.attendableDisplayName;
  const base = linkLabelOf(atendente) ?? ATENDENTES_LABELS.DEFAULT_NAME;
  return base + (atendente.attendableId ? ` (${atendente.attendableId.slice(0, 8)}…)` : "");
}
