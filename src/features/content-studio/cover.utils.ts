/** Controle do aviso "tem uma capa nova para ver" (conveniência por navegador; nunca bloqueia nada). */
const SEEN_KEY_PREFIX = "content-studio:cover-seen:";

export function readSeenCover(packageId: string): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY_PREFIX + packageId);
  } catch {
    return null;
  }
}

export function markCoverSeen(packageId: string, coverImageUrl: string): void {
  try {
    window.localStorage.setItem(SEEN_KEY_PREFIX + packageId, coverImageUrl);
  } catch {
    /* sem armazenamento: o aviso só volta a aparecer ao recarregar */
  }
}

/** Há uma capa pronta (nova ou refeita) que a pessoa ainda não abriu. */
export function hasUnseenCover(
  coverImageUrl: string | null,
  coverGenerating: boolean,
  seenCoverUrl: string | null,
): boolean {
  return Boolean(coverImageUrl) && !coverGenerating && coverImageUrl !== seenCoverUrl;
}
