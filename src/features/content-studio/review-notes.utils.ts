import { REVIEW_NOTES_STORAGE_PREFIX, REVIEW_NOTE_MAX_LENGTH } from "./review-workspace.constants";

/** Observações do revisor ainda não enviadas, por etapa. */
export type ReviewNotes = Readonly<Record<string, string>>;

export const reviewNotesKey = (packageId: string): string => `${REVIEW_NOTES_STORAGE_PREFIX}${packageId}`;

/** Lê o que foi guardado, descartando qualquer coisa que não seja texto por etapa. */
export function parseReviewNotes(raw: string | null): ReviewNotes {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
        .map(([stageId, text]) => [stageId, text.slice(0, REVIEW_NOTE_MAX_LENGTH)]),
    );
  } catch {
    return {};
  }
}

/** Só grava observações com texto; sem nenhuma, apaga a chave. */
export function serializeReviewNotes(notes: ReviewNotes): string | null {
  const filled = Object.fromEntries(Object.entries(notes).filter(([, text]) => text.trim().length > 0));
  return Object.keys(filled).length > 0 ? JSON.stringify(filled) : null;
}

export const hasUnsentNotes = (notes: ReviewNotes): boolean => Object.values(notes).some((text) => text.trim().length > 0);

export function readReviewNotes(packageId: string): ReviewNotes {
  try {
    return parseReviewNotes(window.localStorage.getItem(reviewNotesKey(packageId)));
  } catch {
    return {};
  }
}

/** `false` quando o navegador não deixou guardar (modo privado, cota): a tela segue funcionando sem isso. */
export function writeReviewNotes(packageId: string, notes: ReviewNotes): boolean {
  try {
    const value = serializeReviewNotes(notes);
    if (value === null) window.localStorage.removeItem(reviewNotesKey(packageId));
    else window.localStorage.setItem(reviewNotesKey(packageId), value);
    return true;
  } catch {
    return false;
  }
}

/** Limpa a observação só se ela ainda for o texto que foi enviado (o revisor pode ter digitado mais enquanto enviava). */
export function clearSentNote(notes: ReviewNotes, stageId: string, sentText: string): ReviewNotes {
  if (notes[stageId] !== sentText) return notes;
  const { [stageId]: _sent, ...rest } = notes;
  void _sent;
  return rest;
}
