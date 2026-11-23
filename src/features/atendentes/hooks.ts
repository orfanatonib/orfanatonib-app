import { useCallback, useState } from "react";
import { apiCreateAtendente, apiUpdateAtendente, apiDeleteAtendente } from "./api";
import { ATENDENTES_LABELS } from "./constants";
import type { CreateAtendenteDto, UpdateAtendenteDto, AtendenteFiles } from "./types";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";

/** Criar, editar e excluir; depois de cada uma a lista é recarregada (`refreshPage`). */
export function useAtendenteMutations(refreshPage: () => void | Promise<void>) {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const run = useCallback(
    async (action: () => Promise<unknown>, fallback: string, onSuccess?: () => void) => {
      setDialogLoading(true);
      setDialogError("");
      try {
        await action();
        await refreshPage();
        onSuccess?.();
      } catch (err: unknown) {
        setDialogError(getApiErrorMessage(err, fallback));
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [refreshPage]
  );

  const handleCreate = useCallback(
    (data: CreateAtendenteDto, files: AtendenteFiles, onSuccess?: () => void) =>
      run(() => apiCreateAtendente(data, files), ATENDENTES_LABELS.CREATE_ERROR, onSuccess),
    [run]
  );

  const handleUpdate = useCallback(
    (id: string, data: UpdateAtendenteDto, files?: AtendenteFiles, onSuccess?: () => void) =>
      run(() => apiUpdateAtendente(id, data, files), ATENDENTES_LABELS.UPDATE_ERROR, onSuccess),
    [run]
  );

  const handleDelete = useCallback(
    (id: string, onSuccess?: () => void) =>
      run(() => apiDeleteAtendente(id), ATENDENTES_LABELS.DELETE_FAILED, onSuccess),
    [run]
  );

  return { dialogLoading, dialogError, setDialogError, handleCreate, handleUpdate, handleDelete };
}
