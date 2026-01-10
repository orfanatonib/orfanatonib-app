import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiGetLeader,
  apiListSheltersSimple,
  apiListLeaders,
  type ListLeadersParams,
} from "./api";
import type {
  ShelterSimple,
  LeaderFilters,
  LeaderProfile,
} from "./types";
import type { SortingState } from "@tanstack/react-table";

function mapSortingToServer(sorting: SortingState) {
  const first = sorting?.[0];
  const sortId =
    first?.id === "user" ? "name"
      : first?.id === "createdAt" ? "createdAt"
        : "updatedAt";
  const order: "asc" | "desc" = first?.desc ? "desc" : "asc";
  return { sort: sortId as ListLeadersParams["sort"], order };
}

function mapFiltersToServer(filters: LeaderFilters) {
  return {
    leaderSearchString: filters.leaderSearchString?.trim() || undefined,
    shelterSearchString: filters.shelterSearchString?.trim() || undefined,
    hasShelter: filters.hasShelter,
    searchString: filters.searchString?.trim() || undefined,
    q: filters.q?.trim() || undefined,
    active: filters.active,
    hasShelters: filters.hasShelters,
    shelterName: filters.shelterName?.trim() || undefined,
  } as Omit<ListLeadersParams, "page" | "limit" | "sort" | "order">;
}

export function useLeaderProfiles(
  pageIndex: number,
  pageSize: number,
  sorting: SortingState,
  filters: LeaderFilters
) {
  const [rows, setRows] = useState<LeaderProfile[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { sort, order } = mapSortingToServer(sorting);
      const qFilters = mapFiltersToServer(filters);
      const data = await apiListLeaders({
        page: pageIndex + 1,
        limit: pageSize,
        sort,
        order,
        ...qFilters,
      });
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Erro ao listar líderes"
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, sorting, filters]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const refreshOne = useCallback(async (leaderId: string) => {
    try {
      const updated = await apiGetLeader(leaderId);
      setRows((prev) => {
        const i = prev.findIndex((p) => p.id === leaderId);
        if (i === -1) return prev;
        const next = [...prev];
        next[i] = updated;
        return next;
      });
    } catch {
      setRows((prev) => prev.filter((p) => p.id !== leaderId));
    }
  }, []);

  return { rows, total, loading, error, setError, fetchPage, refreshOne };
}

export function useLeaderMutations(
  refreshPage: () => Promise<void> | void,
  refreshOne: (leaderId: string) => Promise<void> | void
) {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  return { dialogLoading, dialogError, setDialogError };
}

export function useSheltersIndex() {
  const [shelters, setShelters] = useState<ShelterSimple[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const list = await apiListSheltersSimple();
      setShelters(list || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao listar shelters");
    } finally {
      setLoading(false);
    }
  }, []);

  const byNumber = useMemo(() => {
    const map = new Map<number, ShelterSimple>();
    for (const c of shelters) if (typeof c.number === "number") map.set(c.number, c);
    return map;
  }, [shelters]);

  return { shelters, byNumber, loading, error, refresh };
}
