import { useCallback, useState } from "react";
import { AxiosError } from "axios";
import {
  apiCreateShelter,
  apiDeleteShelter,
  apiFetchShelter,
  apiListLeadersSimple,
  apiUpdateShelter,
} from "./api";
import { apiListMembersSimple } from "../members/api";
import {
  ShelterResponseDto,
  CreateShelterForm,
  EditShelterForm,
  MemberOption,
  LeaderOption,
} from "./types";

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
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setDialogError(err.response?.data?.message || err.message || "Erro ao criar abrigo");
        } else {
          setDialogError("Erro ao criar abrigo");
        }
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
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setDialogError(err.response?.data?.message || err.message || "Erro ao atualizar abrigo");
        } else {
          setDialogError("Erro ao atualizar abrigo");
        }
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
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setDialogError(err.response?.data?.message || err.message || "Erro ao remover abrigo");
        } else {
          setDialogError("Erro ao remover abrigo");
        }
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
        vinculado: c.vinculado,
      }));

      const mappedMembers: MemberOption[] = (membersApi ?? []).map((t) => ({
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

