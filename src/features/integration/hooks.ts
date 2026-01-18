import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiGetIntegration,
  apiListIntegrations,
  apiListIntegrationsSimple,
  apiCreateIntegration,
  apiUpdateIntegration,
  apiDeleteIntegration,
  type ListIntegrationsParams,
} from "./api";
import type {
  IntegrationResponseDto,
  IntegrationFilters,
  CreateIntegrationDto,
  UpdateIntegrationDto,
} from "./types";
import type { SortingState } from "@tanstack/react-table";

function mapSortingToServer(sorting: SortingState) {
  const first = sorting?.[0];
  const sortId = first?.id === "name" ? "name"
    : first?.id === "createdAt" ? "createdAt"
      : "updatedAt";
  const order: "asc" | "desc" = first?.desc ? "desc" : "asc";
  return { sort: sortId as ListIntegrationsParams["sort"], order };
}

function mapFiltersToServer(filters: IntegrationFilters) {
  return {
    search: filters.search?.trim() || undefined,
    integrationYear: filters.integrationYear,
  } as Omit<ListIntegrationsParams, "page" | "limit">;
}

export function useIntegrations(
  pageIndex: number,
  pageSize: number,
  sorting: SortingState,
  filters: IntegrationFilters
) {
  const [rows, setRows] = useState<IntegrationResponseDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qFilters = mapFiltersToServer(filters);
      const data = await apiListIntegrations({
        page: pageIndex + 1,
        limit: pageSize,
        ...qFilters,
      });
      setRows(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Erro ao listar integrações"
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, filters]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const refreshOne = useCallback(async (integrationId: string) => {
    try {
      const updated = await apiGetIntegration(integrationId);
      setRows((prev) => {
        const i = prev.findIndex((p) => p.id === integrationId);
        if (i === -1) return prev;
        const next = [...prev];
        next[i] = updated;
        return next;
      });
    } catch {
      setRows((prev) => prev.filter((p) => p.id !== integrationId));
    }
  }, []);

  return { rows, total, loading, error, setError, fetchPage, refreshOne };
}

export function useIntegrationsSimple() {
  const [rows, setRows] = useState<IntegrationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiListIntegrationsSimple();
      setRows(data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Erro ao listar integrações"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { rows, loading, error, setError, fetchData };
}

export function useIntegrationMutations(
  refreshPage: () => Promise<void> | void,
  refreshOne: (integrationId: string) => Promise<void> | void
) {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const handleCreate = useCallback(async (
    data: CreateIntegrationDto,
    files?: File[],
    onSuccess?: () => void
  ) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await apiCreateIntegration(data, files);
      await refreshPage();
      onSuccess?.();
    } catch (err: any) {
      setDialogError(
        err?.response?.data?.message || err.message || "Erro ao criar integração"
      );
      throw err; // Re-throw to allow parent component to handle
    } finally {
      setDialogLoading(false);
    }
  }, [refreshPage]);

  const handleUpdate = useCallback(async (
    id: string,
    data: UpdateIntegrationDto,
    files?: File[],
    onSuccess?: () => void
  ) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await apiUpdateIntegration(id, data, files);
      await refreshOne(id);
      onSuccess?.();
    } catch (err: any) {
      setDialogError(
        err?.response?.data?.message || err.message || "Erro ao atualizar integração"
      );
      throw err; // Re-throw to allow parent component to handle
    } finally {
      setDialogLoading(false);
    }
  }, [refreshOne]);

  const handleDelete = useCallback(async (
    id: string,
    onSuccess?: () => void
  ) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await apiDeleteIntegration(id);
      await refreshPage();
      onSuccess?.();
    } catch (err: any) {
      setDialogError(
        err?.response?.data?.message || err.message || "Erro ao deletar integração"
      );
      throw err; // Re-throw to allow parent component to handle
    } finally {
      setDialogLoading(false);
    }
  }, [refreshPage]);

  return {
    dialogLoading,
    dialogError,
    setDialogError,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}
