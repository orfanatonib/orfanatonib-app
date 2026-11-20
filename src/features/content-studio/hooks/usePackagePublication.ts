import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/utils/apiErrorMessage";

import { getContentPackagePublication, publishContentPackage } from "../api";
import { INITIAL_PUBLICATION_STATE, PUBLICATION_TEXTS } from "../publication.constants";
import { newPublicationKey, publicationStateFrom } from "../publication.utils";
import {
  ContentPackageStatus,
  PublicationPhase,
  type PublicationState,
  type PublicationTestament,
} from "../types";

/**
 * Publicação do material. A chave de idempotência vale por tentativa: um reenvio depois de erro de rede reusa a chave
 * (mesma publicação, nunca duas páginas); depois de uma falha DECIDIDA pela API a próxima tentativa usa chave nova.
 */
export function usePackagePublication(
  packageId: string,
  status: ContentPackageStatus,
  onChanged: () => Promise<void> | void,
  /** Chamado quando a publicação termina bem (a tela de revisão leva o revisor a Materiais de Visita). */
  onPublished?: () => void,
) {
  const [state, setState] = useState<PublicationState>(INITIAL_PUBLICATION_STATE);
  const key = useRef<string | null>(null);

  // Material já publicado: busca a publicação para mostrar o link da página.
  useEffect(() => {
    if (status !== ContentPackageStatus.PUBLISHED) return;
    const controller = new AbortController();
    getContentPackagePublication(packageId, controller.signal)
      .then((publication) => {
        if (publication && !controller.signal.aborted) setState(publicationStateFrom(publication));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [packageId, status]);

  const publish = useCallback(
    async (testament: PublicationTestament): Promise<void> => {
      key.current ??= newPublicationKey();
      setState({ phase: PublicationPhase.PUBLISHING, publication: null, message: null });
      try {
        const publication = await publishContentPackage(packageId, { idempotencyKey: key.current, testament });
        const next = publicationStateFrom(publication);
        // Resposta decidida (publicado/falhou): a próxima tentativa começa com chave nova.
        if (next.phase !== PublicationPhase.PUBLISHING) key.current = null;
        setState(next);
        await onChanged();
        if (next.phase === PublicationPhase.PUBLISHED) onPublished?.();
      } catch (error) {
        setState({
          phase: PublicationPhase.FAILED,
          publication: null,
          message: getApiErrorMessage(error, PUBLICATION_TEXTS.REQUEST_FAILED),
        });
        // 409/4xx não decidiram nada: material mudou de estado; recarrega para esconder o botão se for o caso.
        await onChanged();
      }
    },
    [packageId, onChanged, onPublished],
  );

  const reset = useCallback(() => setState(INITIAL_PUBLICATION_STATE), []);

  return { state, publish, reset };
}
