import { useEffect, useMemo, useState } from "react";
import { isRequestCanceled } from "@/utils/apiErrorMessage";
import { apiListSheltersSimple } from "./api";
import { buildLeaderFilterOptions } from "./utils";
import type { LeaderFilterOptions } from "./types";

/** Abrigos e números de equipe que alimentam os selects de filtro; o erro deixa os selects vazios. */
export function useLeaderFilterOptions(): LeaderFilterOptions {
  const [shelters, setShelters] = useState<Awaited<ReturnType<typeof apiListSheltersSimple>>>([]);

  useEffect(() => {
    const controller = new AbortController();
    apiListSheltersSimple()
      .then((list) => {
        if (!controller.signal.aborted) setShelters(list ?? []);
      })
      .catch((error: unknown) => {
        if (!isRequestCanceled(error)) setShelters([]);
      });
    return () => controller.abort();
  }, []);

  return useMemo(() => buildLeaderFilterOptions(shelters), [shelters]);
}
