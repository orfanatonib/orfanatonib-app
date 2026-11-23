import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetchSheltersSimple } from "@/features/shelters/api";
import { UserRole } from "@/store/slices/auth/authSlice";
import {
  apiCreateSheltered,
  apiDeleteSheltered,
  apiFetchSheltered,
  apiUpdateSheltered,
} from "./api";
import { SHELTERED_MESSAGES } from "./constants";
import {
  buildCreatePayload,
  buildUpdatePayload,
  extractApiErrorMessage,
  findShelterOfMember,
  resolveLeaderShelter,
  resolveMemberShelter,
  validateCreateDates,
  validateUpdateDates,
} from "./utils";
import type {
  AuthUser,
  CreateShelteredForm,
  EditShelteredForm,
  ShelteredResponseDto,
  ShelterOption,
} from "./types";

export type UseShelteredDetailsResult = {
  viewing: ShelteredResponseDto | null;
  setViewing: (sheltered: ShelteredResponseDto | null) => void;
  loading: boolean;
  fetchSheltered: (id: string) => Promise<void>;
};

/** Loads the full record behind the detail dialog. */
export function useShelteredDetails(): UseShelteredDetailsResult {
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

export type UseShelteredMutationsResult = {
  dialogLoading: boolean;
  dialogError: string;
  setDialogError: (message: string) => void;
  createSheltered: (payload: CreateShelteredForm) => Promise<boolean>;
  updateSheltered: (
    id: string,
    payload: Omit<EditShelteredForm, "id">,
  ) => Promise<boolean>;
  deleteSheltered: (id: string) => Promise<boolean>;
};

/**
 * Owns the write operations and their dialog feedback. Each call refetches the
 * current page so the list never drifts from the server.
 */
export function useShelteredMutations(
  refetch: () => Promise<void>,
): UseShelteredMutationsResult {
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const createSheltered = useCallback(
    async (payload: CreateShelteredForm): Promise<boolean> => {
      const validation = validateCreateDates(payload);
      if (!validation.valid) {
        setDialogError(validation.message);
        return false;
      }

      setDialogLoading(true);
      setDialogError("");
      try {
        await apiCreateSheltered(buildCreatePayload(payload));
        await refetch();
        return true;
      } catch (caught) {
        setDialogError(extractApiErrorMessage(caught, SHELTERED_MESSAGES.CREATE_ERROR));
        return false;
      } finally {
        setDialogLoading(false);
      }
    },
    [refetch],
  );

  const updateSheltered = useCallback(
    async (id: string, payload: Omit<EditShelteredForm, "id">): Promise<boolean> => {
      const validation = validateUpdateDates(payload);
      if (!validation.valid) {
        setDialogError(validation.message);
        return false;
      }

      setDialogLoading(true);
      setDialogError("");
      try {
        await apiUpdateSheltered(id, buildUpdatePayload(payload));
        await refetch();
        return true;
      } catch (caught) {
        setDialogError(extractApiErrorMessage(caught, SHELTERED_MESSAGES.UPDATE_ERROR));
        return false;
      } finally {
        setDialogLoading(false);
      }
    },
    [refetch],
  );

  const deleteSheltered = useCallback(
    async (id: string): Promise<boolean> => {
      setDialogLoading(true);
      setDialogError("");
      try {
        await apiDeleteSheltered(id);
        await refetch();
        return true;
      } catch (caught) {
        setDialogError(extractApiErrorMessage(caught, SHELTERED_MESSAGES.DELETE_ERROR));
        return false;
      } finally {
        setDialogLoading(false);
      }
    },
    [refetch],
  );

  return {
    dialogLoading,
    dialogError,
    setDialogError,
    createSheltered,
    updateSheltered,
    deleteSheltered,
  };
}

export type UseShelterOptionsResult = {
  options: ShelterOption[];
  loading: boolean;
  error: string;
  /** Shelter the role forces onto the form, when there is one. */
  enforcedShelterId: string | null;
};

/**
 * Loads the shelters the current user may pick from. Members are pinned to the
 * single shelter of their team; leaders and admins get the full list.
 */
export function useShelterOptions(
  open: boolean,
  user: AuthUser | null,
): UseShelterOptionsResult {
  const [options, setOptions] = useState<ShelterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isMember = user?.role === UserRole.MEMBER;
  const isLeader = user?.role === UserRole.LEADER;

  const memberShelter = useMemo(() => resolveMemberShelter(user), [user]);
  const leaderShelter = useMemo(() => resolveLeaderShelter(user), [user]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const shelters = await apiFetchSheltersSimple();
        if (cancelled) return;

        const all: ShelterOption[] = shelters.map((shelter) => ({
          id: shelter.id,
          name: shelter.name,
        }));

        if (!isMember) {
          setOptions(all);
          return;
        }

        const fromApi = findShelterOfMember(
          shelters,
          user?.memberProfile?.id,
          user?.id,
        );
        const resolved = fromApi ?? memberShelter;
        setOptions(resolved ? [resolved] : []);
      } catch (caught) {
        if (!cancelled) {
          setError(extractApiErrorMessage(caught, SHELTERED_MESSAGES.SHELTERS_ERROR));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, isMember, memberShelter, user?.memberProfile?.id, user?.id]);

  const enforcedShelterId = isMember
    ? (options[0]?.id ?? memberShelter?.id ?? null)
    : isLeader
      ? (leaderShelter?.id ?? null)
      : null;

  return { options, loading, error, enforcedShelterId };
}
