import { useCallback, useEffect, useState, useRef } from "react";
import {
  apiCreateShelter,
  apiDeleteShelter,
  apiFetchShelter,
  apiFetchShelters,
  apiListLeadersSimple,
  apiUpdateShelter,
} from "./api";
import { apiListMembersSimple } from "../members/api";
import {
  ShelterResponseDto,
  CreateShelterForm,
  EditShelterForm,
  MemberOption,
  ShelterFilters,
  ShelterSort,
  LeaderOption,
} from "./types";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (typeof value === 'object' && value !== null) {
        const cleanedValue = Object.fromEntries(
          Object.entries(value as any).map(([key, val]) => [
            key, 
            val === "" || val === null || val === undefined ? undefined : val
          ])
        ) as T;
        setDebouncedValue(cleanedValue);
      } else {
        setDebouncedValue(value);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [JSON.stringify(value), delay]); 

  return debouncedValue;
}

export function useShelters(
  pageIndex: number,
  pageSize: number,
  sorting: ShelterSort,
  filters: ShelterFilters
) {
  const [rows, setRows] = useState<ShelterResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const debouncedFilters = useDebounce(filters, 500);
  
  const lastRequestRef = useRef<string>("");

  const fetchPage = useCallback(async (force = false) => {
    const requestKey = `${pageIndex}-${pageSize}-${JSON.stringify(sorting)}-${JSON.stringify(debouncedFilters)}`;
    
    if (!force && lastRequestRef.current === requestKey) {
      return;
    }
    
    lastRequestRef.current = requestKey;
    
    setLoading(true);
    setError("");
    try {
      const data = await apiFetchShelters({
        page: pageIndex + 1,
        limit: pageSize,
        filters: debouncedFilters,
        sort: sorting,
      });
      setRows(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? 0));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao listar shelters");
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, sorting, JSON.stringify(debouncedFilters)]); 

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { rows, total, loading, error, setRows, setTotal, fetchPage: () => fetchPage(true), setError };
}

export function useShelterDetails() {
  const [viewing, setViewing] = useState<ShelterResponseDto | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchShelter = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setViewing(await apiFetchShelter(id));
    } finally {
      setLoading(false);
    }
  }, []);

  return { viewing, setViewing, loading, fetchShelter };
}

export function useShelterMutations(
  onSuccess?: () => Promise<void>
) {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const createShelter = useCallback(
    async (payload: CreateShelterForm | FormData) => {
      setDialogLoading(true);
      setDialogError("");
      try {
        const result = await apiCreateShelter(payload);
        if (onSuccess) await onSuccess();
        return result;
      } catch (err: any) {
        setDialogError(err?.response?.data?.message || err.message || "Erro ao criar shelter");
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [onSuccess]
  );

  const updateShelter = useCallback(
    async (id: string, payload: Omit<EditShelterForm, "id"> | FormData) => {
      setDialogLoading(true);
      setDialogError("");
      try {
        const result = await apiUpdateShelter(id, payload);
        if (onSuccess) await onSuccess();
        return result;
      } catch (err: any) {
        setDialogError(err?.response?.data?.message || err.message || "Erro ao atualizar shelter");
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [onSuccess]
  );

  const deleteShelter = useCallback(
    async (id: string) => {
      setDialogLoading(true);
      setDialogError("");
      try {
        await apiDeleteShelter(id);
        if (onSuccess) await onSuccess();
      } catch (err: any) {
        setDialogError(err?.response?.data?.message || err.message || "Erro ao remover shelter");
        throw err;
      } finally {
        setDialogLoading(false);
      }
    },
    [onSuccess]
  );

  return { dialogLoading, dialogError, setDialogError, createShelter, updateShelter, deleteShelter };
}

export function useOptions() {
  const [leaders, setLeaders] = useState<LeaderOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadRefs = useCallback(async () => {
    if (loaded) return;
    
    setLoading(true);
    try {
      const [coordsApi, membersApi] = await Promise.all([
        apiListLeadersSimple(),
        apiListMembersSimple(),
      ]);

      const mappedCoords: LeaderOption[] = (coordsApi ?? []).map((c) => ({
        leaderProfileId: c.leaderProfileId,
        name: c.name,
      }));

      const mappedMembers: MemberOption[] = (membersApi ?? []).map((t: any) => ({
        memberProfileId: t.memberProfileId,
        name: t.name,
        vinculado: !!t.vinculado,
      }));

      setLeaders(mappedCoords);
      setMembers(mappedMembers);
      setLoaded(true);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const reloadOptions = useCallback(async () => {
    setLoaded(false);
    await loadRefs();
  }, [loadRefs]);

  return { leaders, members, loading, reloadOptions, loadRefs };
}

