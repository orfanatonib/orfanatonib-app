import { useCallback, useEffect, useState } from "react";

import { clearSentNote, hasUnsentNotes, readReviewNotes, writeReviewNotes, type ReviewNotes } from "../review-notes.utils";

/** Observações digitadas e ainda não enviadas: sobrevivem a recarregar a página ou a sessão expirar. */
export function useReviewNotes(packageId: string | undefined) {
  const [notes, setNotes] = useState<ReviewNotes>({});
  const [loadedFor, setLoadedFor] = useState("");
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    if (!packageId || loadedFor === packageId) return;
    const stored = readReviewNotes(packageId);
    setNotes(stored);
    setRecovered(hasUnsentNotes(stored));
    setLoadedFor(packageId);
  }, [packageId, loadedFor]);

  useEffect(() => {
    if (packageId && loadedFor === packageId) writeReviewNotes(packageId, notes);
  }, [packageId, loadedFor, notes]);

  const change = useCallback((stageId: string, text: string) => setNotes((current) => ({ ...current, [stageId]: text })), []);
  const clearSent = useCallback(
    (stageId: string, sentText: string) => setNotes((current) => clearSentNote(current, stageId, sentText)),
    [],
  );

  return {
    notes,
    hasUnsent: hasUnsentNotes(notes),
    recovered,
    dismissRecovered: () => setRecovered(false),
    change,
    clearSent,
  };
}
