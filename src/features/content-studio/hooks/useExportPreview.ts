import { useCallback, useEffect, useState } from "react";

import { fetchExport } from "../api";

interface State {
  url: string | null;
  loading: boolean;
  error: string | null;
}

function messageFor(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 422) return "Ainda não há conteúdo salvo para gerar o PDF. Escreva ou gere o conteúdo e salve.";
  if (status === 503) return "O conversor de PDF está ocupado. Tente novamente em instantes.";
  return "Não foi possível gerar o PDF agora.";
}

/**
 * Prévia (PDF) do que está SALVO: baixa o arquivo como blob e mostra por URL de objeto. Refaz quando `versionKey`
 * muda (nova versão salva) e libera a URL antiga para não vazar memória.
 */
export function useExportPreview(packageId: string, path: string, versionKey: string | null, enabled: boolean) {
  const [state, setState] = useState<State>({ url: null, loading: false, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    setState({ url: null, loading: true, error: null });
    fetchExport(packageId, path, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ url: null, loading: false, error: messageFor(error) });
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [packageId, path, versionKey, enabled, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { ...state, reload };
}
