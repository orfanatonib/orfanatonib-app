import { useCallback, useEffect, useState } from "react";
import {
  apiCreateSheltered, apiDeleteSheltered, apiFetchSheltered, apiFetchShelteredren, apiUpdateSheltered
} from "./api";
import { ShelteredFilters, ShelteredResponseDto, ShelteredSort, CreateShelteredForm, EditShelteredForm } from "./types";
import { digitsOnly } from "@/utils/masks";

function normalizeBackendMessage(msg: unknown): string {
  if (Array.isArray(msg)) return msg.filter(Boolean).join("\n");
  if (typeof msg === "string") return msg;
  return "";
}

function normalizeIsoDateString(input?: string | null): string | null | undefined {
  if (input === null) return null;
  if (input === undefined) return undefined;
  const raw = String(input).trim();
  if (!raw) return raw as any;

  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [, dd, mm, yyyy] = br;
    return `${yyyy}-${mm}-${dd}`;
  }

  const iso = raw.match(/^(\d{4,})-(\d{2})-(\d{2})$/);
  if (iso) {
    let [, y, m, d] = iso;
    if (y.length > 4) y = y.slice(-4);
    return `${y}-${m}-${d}`;
  }

  return raw;
}

function isValidIsoDate(iso: string): boolean {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return false;
  if (mo < 1 || mo > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

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
      setError(err?.response?.data?.message || err.message || "Erro ao listar acolhidos");
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

  const createSheltered = useCallback(async (payload: CreateShelteredForm, page: number, limit: number, filters?: ShelteredFilters, sort?: ShelteredSort): Promise<boolean> => {
    setDialogLoading(true);
    setDialogError("");
    try {
      const birthDate = normalizeIsoDateString(payload.birthDate) as string;
      const joinedAt = normalizeIsoDateString(payload.joinedAt ?? null) as string | null;
      if (!birthDate || !isValidIsoDate(birthDate)) {
        setDialogError("Data de nascimento inválida. Use o formato DD/MM/AAAA.");
        setDialogLoading(false);
        return false;
      }
      if (joinedAt && !isValidIsoDate(joinedAt)) {
        setDialogError('Data "No abrigo desde" inválida. Use o formato DD/MM/AAAA.');
        setDialogLoading(false);
        return false;
      }
      const guardianPhone = digitsOnly(payload.guardianPhone);
      const postalCode = digitsOnly(payload.address?.postalCode);
      const nextAddress = payload.address ? { ...payload.address, postalCode } : payload.address;
      await apiCreateSheltered({ ...payload, birthDate, joinedAt, guardianPhone, address: nextAddress as any });
      await refetch(page, limit, filters, sort);
      setDialogLoading(false);
      return true;
    } catch (err: any) {
      const backendMsg = normalizeBackendMessage(err?.response?.data?.message);
      setDialogError(backendMsg || err?.message || "Erro ao criar acolhido");
      setDialogLoading(false);
      return false;
    }
  }, [refetch]);

  const updateSheltered = useCallback(async (id: string, payload: Omit<EditShelteredForm, "id">, page: number, limit: number, filters?: ShelteredFilters, sort?: ShelteredSort): Promise<boolean> => {
    setDialogLoading(true);
    setDialogError("");
    try {
      const birthDate = normalizeIsoDateString((payload as any).birthDate) as string | undefined;
      const joinedAt = normalizeIsoDateString((payload as any).joinedAt ?? undefined) as string | null | undefined;
      const nextPayload: any = { ...payload };
      if (birthDate !== undefined) {
        if (!birthDate || !isValidIsoDate(birthDate)) {
          setDialogError("Data de nascimento inválida. Use o formato DD/MM/AAAA.");
          setDialogLoading(false);
          return false;
        }
        nextPayload.birthDate = birthDate;
      }
      if (joinedAt !== undefined) {
        if (joinedAt && !isValidIsoDate(joinedAt)) {
          setDialogError('Data "No abrigo desde" inválida. Use o formato DD/MM/AAAA.');
          setDialogLoading(false);
          return false;
        }
        nextPayload.joinedAt = joinedAt;
      }

      if (nextPayload.guardianPhone !== undefined) {
        nextPayload.guardianPhone = digitsOnly(nextPayload.guardianPhone);
      }
      if (nextPayload.address?.postalCode !== undefined) {
        nextPayload.address = {
          ...nextPayload.address,
          postalCode: digitsOnly(nextPayload.address.postalCode),
        };
      }

      await apiUpdateSheltered(id, nextPayload);
      await refetch(page, limit, filters, sort);
      setDialogLoading(false);
      return true;
    } catch (err: any) {
      const backendMsg = normalizeBackendMessage(err?.response?.data?.message);
      setDialogError(backendMsg || err?.message || "Erro ao atualizar acolhido");
      setDialogLoading(false);
      return false;
    }
  }, [refetch]);

  const deleteSheltered = useCallback(async (id: string, page: number, limit: number, filters?: ShelteredFilters, sort?: ShelteredSort) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await apiDeleteSheltered(id);
      await refetch(page, limit, filters, sort);
    } catch (err: any) {
      setDialogError(err?.response?.data?.message || err.message || "Erro ao remover acolhido");
    } finally {
      setDialogLoading(false);
    }
  }, [refetch]);

  return { dialogLoading, dialogError, setDialogError, createSheltered, updateSheltered, deleteSheltered };
}
