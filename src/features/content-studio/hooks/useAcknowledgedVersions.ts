import { useCallback, useEffect, useState } from "react";

import { captureStageVersions, hasStageVersionChanged, type AcknowledgedVersions } from "../review-workspace.utils";
import type { ContentStageResponse, ContentTrackResponse } from "../types";

/**
 * Lembra qual versão de cada etapa o revisor realmente abriu. Uma atualização ao vivo pode trocar o conteúdo por
 * baixo; a decisão fica bloqueada até ele confirmar que releu a versão atual.
 */
export function useAcknowledgedVersions(packageId: string | undefined, tracks: readonly ContentTrackResponse[] | undefined) {
  const [state, setState] = useState<{ packageId: string; versions: AcknowledgedVersions }>({ packageId: "", versions: {} });

  useEffect(() => {
    if (!packageId || !tracks) return;
    setState((current) =>
      current.packageId === packageId
        ? { packageId, versions: captureStageVersions(current.versions, tracks) }
        : { packageId, versions: captureStageVersions({}, tracks) },
    );
  }, [packageId, tracks]);

  const ready = Boolean(packageId) && state.packageId === packageId;
  const hasChanged = useCallback(
    (stage: ContentStageResponse | undefined) => ready && hasStageVersionChanged(state.versions, stage),
    [ready, state.versions],
  );
  const acknowledge = useCallback(
    (stage: ContentStageResponse) =>
      setState((current) => ({ ...current, versions: { ...current.versions, [stage.id]: stage.currentVersionId } })),
    [],
  );
  return { hasChanged, acknowledge };
}
