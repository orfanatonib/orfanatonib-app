import { useCallback, useEffect, useState } from "react";
import {
  apiListAtendentes,
  apiGetAtendente,
  apiCreateAtendente,
  apiUpdateAtendente,
  apiDeleteAtendente,
} from "./api";
import type {
  AtendenteResponseDto,
  AtendenteFilters,
  CreateAtendenteDto,
  UpdateAtendenteDto,
} from "./types";
import type { SortingState } from "@tanstack/react-table";

function mapFiltersToServer(filters: AtendenteFilters) {
  return {
    search: filters.search?.trim() || undefined,
    attendableType: filters.attendableType,
  };
}

export function useAtendentes(
  pageIndex: number,
  pageSize: number,
  _sorting: SortingState,
  filters: AtendenteFilters
) {
  const [rows, setRows] = useState<AtendenteResponseDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qFilters = mapFiltersToServer(filters);
      const data = await apiListAtendentes({
        page: pageIndex + 1,
        limit: pageSize,
        ...qFilters,
      });
      setRows(data.data || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      setError(
        message || (err instanceof Error ? err.message : "Erro ao listar antecedentes criminais")
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, filters]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const refreshOne = useCallback(async (id: string) => {
    try {
      const updated = await apiGetAtendente(id);
      setRows((prev) => {
        const i = prev.findIndex((p) => p.id === id);
        if (i === -1) return prev;
        const next = [...prev];
        next[i] = updated;
        return next;
      });
    } catch {
      setRows((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  return { rows, total, loading, error, setError, fetchPage, refreshOne };
}

export function useAtendenteMutations(
  refreshPage: () => void | Promise<void>,
  refreshOne: (id: string) => void | Promise<void>
) {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const handleCreate = useCallback(
    async (
      data: CreateAtendenteDto,
      file: File,
      onSuccess?: () => void
    ) => {
      setDialogLoading(true);
      setDialogError("");
      try {
        await apiCreateAtendente(data, file);
        await refreshPage();
        onSuccess?.();
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data
                ?.message
            : null;
        setDialogError(
          message ||
            (err instanceof Error ? err.message : "Erro ao criar antecedente criminal")
        );
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [refreshPage]
  );

  const handleUpdate = useCallback(
    async (
      id: string,
      data: UpdateAtendenteDto,
      file?: File,
      onSuccess?: () => void
    ) => {
      setDialogLoading(true);
      setDialogError("");
      try {
        await apiUpdateAtendente(id, data, file);
        await refreshOne(id);
        onSuccess?.();
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data
                ?.message
            : null;
        setDialogError(
          message ||
            (err instanceof Error ? err.message : "Erro ao atualizar antecedente criminal")
        );
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [refreshOne]
  );

  const handleDelete = useCallback(
    async (id: string, onSuccess?: () => void) => {
      setDialogLoading(true);
      setDialogError("");
      try {
        await apiDeleteAtendente(id);
        await refreshPage();
        onSuccess?.();
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data
                ?.message
            : null;
        setDialogError(
          message ||
            (err instanceof Error ? err.message : "Erro ao deletar antecedente criminal")
        );
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [refreshPage]
  );

  return {
    dialogLoading,
    dialogError,
    setDialogError,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
