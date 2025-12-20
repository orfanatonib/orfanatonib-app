import { useCallback, useEffect, useState } from "react";
import {
  apiCreateSheltered, apiDeleteSheltered, apiFetchSheltered, apiFetchShelteredren, apiUpdateSheltered
} from "./api";
import { ShelteredFilters, ShelteredResponseDto, ShelteredSort, CreateShelteredForm, EditShelteredForm } from "./types";

export function useSheltered(pageIndex: number, pageSize: number, sorting: ShelteredSort, filters: ShelteredFilters) {
  const [rows, setRows] = useState<ShelteredResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetchShelteredren({
        page: pageIndex + 1,
        limit: pageSize,
        filters,
        sort: sorting,
      });
      const meta = (data as any)?.meta;
      setRows(Array.isArray((data as any)?.data) ? (data as any).data : []);
      setTotal(Number(meta?.totalItems ?? (data as any)?.total ?? 0));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao listar abrigados");
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, filters, sorting]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  return { rows, total, loading, error, setError, fetchPage };
}

export function useShelteredDetails() {
  const [viewing, setViewing] = useState<ShelteredResponseDto | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSheltered = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setViewing(await apiFetchSheltered(id));
    } finally {
      setLoading(false);
    }
  }, []);

  return { viewing, setViewing, loading, fetchSheltered };
}

export function useShelteredMutations(refetch: (page: number, limit: number, filters?: ShelteredFilters, sort?: ShelteredSort) => Promise<void> | void) {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const createSheltered = useCallback(async (payload: CreateShelteredForm, page: number, limit: number, filters?: ShelteredFilters, sort?: ShelteredSort) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await apiCreateSheltered(payload);
      await refetch(page, limit, filters, sort);
    } catch (err: any) {
      setDialogError(err?.response?.data?.message || err.message || "Erro ao criar abrigado");
    } finally {
      setDialogLoading(false);
    }
  }, [refetch]);

  const updateSheltered = useCallback(async (id: string, payload: Omit<EditShelteredForm, "id">, page: number, limit: number, filters?: ShelteredFilters, sort?: ShelteredSort) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await apiUpdateSheltered(id, payload);
      await refetch(page, limit, filters, sort);
    } catch (err: any) {
      setDialogError(err?.response?.data?.message || err.message || "Erro ao atualizar abrigado");
    } finally {
      setDialogLoading(false);
    }
  }, [refetch]);

  const deleteSheltered = useCallback(async (id: string, page: number, limit: number, filters?: ShelteredFilters, sort?: ShelteredSort) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await apiDeleteSheltered(id);
      await refetch(page, limit, filters, sort);
    } catch (err: any) {
      setDialogError(err?.response?.data?.message || err.message || "Erro ao remover abrigado");
    } finally {
      setDialogLoading(false);
    }
  }, [refetch]);

  return { dialogLoading, dialogError, setDialogError, createSheltered, updateSheltered, deleteSheltered };
}
