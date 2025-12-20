import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CreatePagelaPayload,
  Pagela,
  UpdatePagelaPayload,
} from "./types";
import {
  apiListPagelasPaginated,
  apiCreatePagela,
  apiUpdatePagela,
  apiDeletePagela,
} from "./api";
import { apiFetchShelteredSimple, apiUpdateShelteredStatus } from "../sheltered/api";
import type { ShelteredSimpleResponseDto } from "../sheltered/types";

export type Tri = "any" | "yes" | "no";
const triToBoolString = (t: Tri): "true" | "false" | undefined =>
  t === "yes" ? "true" : t === "no" ? "false" : undefined;

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useShelteredBrowser() {
  const [q, setQ] = useState("");
  const [acceptedJesus, setAcceptedJesus] = useState<"all" | "accepted" | "not_accepted">("all");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 10 itens por página
  const [items, setItems] = useState<ShelteredSimpleResponseDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setShelteredError] = useState<string>("");

  const debouncedQ = useDebouncedValue(q, 500);
  const prevDebouncedQRef = React.useRef<string>("");
  const prevAcceptedJesusRef = React.useRef<"all" | "accepted" | "not_accepted">("all");
  const prevActiveRef = React.useRef<"all" | "active" | "inactive">("all");
  const prevPageRef = React.useRef<number>(1);
  const isInitialMount = React.useRef<boolean>(true);

  const search = useCallback(async (
    searchTerm: string, 
    pageNum: number = 1, 
    acceptedJesusFilter: "all" | "accepted" | "not_accepted" = "all",
    activeFilter: "all" | "active" | "inactive" = "all"
  ) => {
    setLoading(true);
    setShelteredError("");
    try {
      const response = await apiFetchShelteredSimple({
        page: pageNum,
        limit,
        searchString: searchTerm || undefined,
        acceptedJesus: acceptedJesusFilter,
        active: activeFilter,
      });
      setItems(response.data || []);
      setTotalItems(response.meta?.totalItems || 0);
      setTotalPages(response.meta?.totalPages || 0);
    } catch (e: any) {
      setShelteredError(
        e?.response?.data?.message || e?.message || "Erro ao listar abrigados"
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const filtersChanged = 
      prevDebouncedQRef.current !== debouncedQ || 
      prevAcceptedJesusRef.current !== acceptedJesus ||
      prevActiveRef.current !== active;
    const pageChanged = prevPageRef.current !== page;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevDebouncedQRef.current = debouncedQ;
      prevAcceptedJesusRef.current = acceptedJesus;
      prevActiveRef.current = active;
      prevPageRef.current = page;
      search(debouncedQ, page, acceptedJesus, active);
      return;
    }

    if (filtersChanged) {
      setPage(1);
      prevDebouncedQRef.current = debouncedQ;
      prevAcceptedJesusRef.current = acceptedJesus;
      prevActiveRef.current = active;
      prevPageRef.current = 1;
      search(debouncedQ, 1, acceptedJesus, active);
    } else if (pageChanged) {
      prevPageRef.current = page;
      search(debouncedQ, page, acceptedJesus, active);
    }
  }, [debouncedQ, acceptedJesus, active, page, search]);

  const onChangeQ = (v: string) => {
    setQ(v);
  };

  const onChangeAcceptedJesus = (v: "all" | "accepted" | "not_accepted") => {
    setAcceptedJesus(v);
  };

  const onChangeActive = (v: "all" | "active" | "inactive") => {
    setActive(v);
  };

  const updateStatus = useCallback(async (id: string, newActive: boolean) => {
    setLoading(true);
    setShelteredError("");
    try {
      await apiUpdateShelteredStatus(id, newActive);
      await search(debouncedQ, page, acceptedJesus, active);
    } catch (e: any) {
      setShelteredError(
        e?.response?.data?.message || e?.message || "Erro ao atualizar status do abrigado"
      );
    } finally {
      setLoading(false);
    }
  }, [search, debouncedQ, page, acceptedJesus, active]);

  const refetch = useCallback(async () => {
    await search(debouncedQ, page, acceptedJesus, active);
  }, [search, debouncedQ, page, acceptedJesus, active]);

  const byId = useMemo(() => new Map(items.map((c) => [c.id, c])), [items]);

  return { 
    q, 
    onChangeQ,
    acceptedJesus,
    onChangeAcceptedJesus,
    active,
    onChangeActive,
    items, 
    byId, 
    loading, 
    error, 
    setError: setShelteredError, 
    refetch,
    updateStatus,
    pagination: {
      page,
      setPage,
      limit,
      totalItems,
      totalPages,
    },
  };
}

export function useShelteredPagelas(
  shelteredId: string | null | undefined,
  initial?: { year?: number; visit?: number; limit?: number }
) {
  const [year, setYearState] = useState<number | undefined>(initial?.year);
  const [visit, setVisitState] = useState<number | undefined>(initial?.visit);
  const [presentQ, setPresentQState] = useState<Tri>("any");
  const [rows, setRows] = useState<Pagela[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initial?.limit ?? 12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (initial?.limit !== undefined) {
      setLimit(initial.limit);
      setPage(1); // Resetar página quando o limite mudar
    }
  }, [initial?.limit]);
  const setYear = useCallback((v?: number) => { setYearState(v); setPage(1); }, []);
  const setVisit = useCallback((v?: number) => { setVisitState(v); setPage(1); }, []);
  const setPresentQ = useCallback((v: Tri) => { setPresentQState(v); setPage(1); }, []);

  const clearFilters = useCallback(() => {
    setYear(undefined);
    setVisit(undefined);
    setPresentQ("any");
  }, [setYear, setVisit, setPresentQ]);

  type Query = {
    shelteredId: string;
    year?: number;
    visit?: number;
    present?: "true" | "false";
    page: number;
    limit: number;
  };

  const query: Query | null = useMemo(() => {
    if (!shelteredId) return null;
    return {
      shelteredId,
      year,
      visit,
      present: triToBoolString(presentQ),
      page,
      limit,
    };
  }, [shelteredId, year, visit, presentQ, page, limit]);

  const debouncedQuery = useDebouncedValue(query, 250);
  const lastKeyRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(
    async (force = false, q: Query | null = query) => {
      if (!q) {
        setRows([]);
        setTotal(0);
        return;
      }
      const key = JSON.stringify(q);
      if (!force && key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError("");
      try {
        const data = await apiListPagelasPaginated(q, { signal: ctrl.signal });
        setRows(data.items || []);
        setTotal(data.total || 0);
      } catch (e: any) {
        if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
          setError(e?.response?.data?.message || e?.message || "Erro ao listar pagelas");
        }
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void doFetch(false, debouncedQuery);
  }, [debouncedQuery]);

  const create = useCallback(
    async (payload: CreatePagelaPayload) => {
      const res = await apiCreatePagela(payload);
      setRows((prev) => [res, ...prev]);
      await doFetch(true);
    },
    [doFetch]
  );

  const update = useCallback(
    async (id: string, payload: UpdatePagelaPayload) => {
      setRows((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...payload } as Pagela) : p)));
      const res = await apiUpdatePagela(id, payload);
      setRows((prev) => prev.map((p) => (p.id === id ? res : p)));
      await doFetch(true);
    },
    [doFetch]
  );

  const remove = useCallback(
    async (id: string) => {
      setRows((prev) => prev.filter((p) => p.id !== id));
      await apiDeletePagela(id);
      await doFetch(true);
    },
    [doFetch]
  );

  return {
    filters: {
      year, visit, presentQ,
      setYear, setVisit, setPresentQ, clearFilters,
    },
    list: {
      rows, total, page, limit,
      setPage, setLimit,
      loading, error, setError,
      refresh: () => doFetch(true),
    },
    actions: { create, update, remove },
  };
}
