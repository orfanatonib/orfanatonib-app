import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGetMember,
  apiListSheltersSimple,
  apiListMembers,
} from "./api";
import { ShelterSimple, MemberProfile, MemberQuery, Page } from "./types";
import type { SortingState } from "@tanstack/react-table";

export function useMemberProfiles(
  pageIndex: number,  
  pageSize: number,
  sorting: SortingState,
  filters: Pick<MemberQuery, "memberSearchString" | "shelterSearchString" | "hasShelter" | "teamId" | "teamName" | "hasTeam">,
) {
  const [rows, setRows] = useState<MemberProfile[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        memberSearchString: filters.memberSearchString ?? undefined,
        shelterSearchString: filters.shelterSearchString ?? undefined,
        hasShelter: filters.hasShelter ?? undefined,
        teamId: filters.teamId ?? undefined,
        teamName: filters.teamName ?? undefined,
        hasTeam: filters.hasTeam ?? undefined,
      }),
    [filters.memberSearchString, filters.shelterSearchString, filters.hasShelter, filters.teamId, filters.teamName, filters.hasTeam]
  );

  const sortParam = useMemo<Pick<MemberQuery, "sort" | "order">>(() => {
    const first = sorting?.[0];
    const map: Record<string, MemberQuery["sort"]> = {
      member: "name",
      updatedAt: "updatedAt",
      createdAt: "createdAt",
      shelter: "name",
      coord: "name",
    };
    if (!first) return { sort: "updatedAt", order: "desc" };
    const sort = map[first.id] ?? "updatedAt";
    const order: "asc" | "desc" = first.desc ? "desc" : "asc";
    return { sort, order };
  }, [sorting]);

  const seqRef = useRef(0);

  const fetchPage = useCallback(async () => {
    const mySeq = ++seqRef.current;
    setLoading(true);
    setError("");
    try {
      const data: Page<MemberProfile> = await apiListMembers({
        ...(JSON.parse(filtersKey) as Pick<MemberQuery, "memberSearchString" | "shelterSearchString" | "hasShelter" | "teamId" | "teamName" | "hasTeam">),
        page: pageIndex + 1, 
        limit: pageSize,
        sort: sortParam.sort,
        order: sortParam.order,
      });

      if (mySeq !== seqRef.current) return;

      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      if (mySeq !== seqRef.current) return;
      setError(err?.response?.data?.message || err.message || "Erro ao listar membros");
    } finally {
      if (mySeq === seqRef.current) setLoading(false);
    }
  }, [filtersKey, pageIndex, pageSize, sortParam]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const refreshOne = useCallback(async (memberId: string) => {
    try {
      const prof = await apiGetMember(memberId);
      setRows(prev => {
        const i = prev.findIndex(p => p.id === memberId);
        if (i === -1) return prev;
        const next = [...prev]; next[i] = prof; return next;
      });
    } catch {
      setRows(prev => prev.filter(p => p.id !== memberId));
    }
  }, []);

  return { rows, total, loading, error, setError, fetchPage, refreshOne };
}

export function useMemberMutations(
  refreshPage: () => Promise<void> | void,
  refreshOne: (memberId: string) => Promise<void> | void
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

  const byId = useMemo(() => {
    const map = new Map<string, ShelterSimple>();
    for (const c of shelters) map.set(c.id, c);
    return map;
  }, [shelters]);

  return { shelters, byId, loading, error, refresh };
}
