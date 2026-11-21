import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { extractErrorMessage } from '@/utils/errorHandler';

import {
  apiCreateFeatureFlag,
  apiDeleteFeatureFlag,
  apiGetFeatureFlagStats,
  apiListFeatureFlags,
  apiSetFeatureFlagEnabled,
  apiSyncFeatureFlagCatalog,
  apiUpdateFeatureFlag,
} from '../api';
import { countFlagsByArea, featureFlagAreaOf, groupFlagsByArea } from '../areas';
import {
  FEATURE_FLAGS_DEFAULT_LIMIT,
  FEATURE_FLAGS_FETCH_LIMIT,
  FEATURE_FLAGS_FETCH_MAX_PAGES,
  FEATURE_FLAGS_SEARCH_DEBOUNCE_MS,
} from '../constants';
import type {
  FeatureFlagAreaId,
  FeatureFlagAudience,
  FeatureFlagFormValues,
  FeatureFlagListFilters,
  FeatureFlagQuery,
  FeatureFlagResponse,
  FeatureFlagStats,
} from '../types';
import {
  isFeatureFlagVersionConflict,
  toCreateFeatureFlagRequest,
  toUpdateFeatureFlagRequest,
} from '../utils/featureFlagUtils';

const INITIAL_FILTERS: FeatureFlagListFilters = {
  status: '',
  audience: '',
  sort: 'name',
  order: 'ASC',
};

const EMPTY_STATS: FeatureFlagStats = {
  total: 0,
  enabled: 0,
  disabled: 0,
  byAudience: {
    EVERYONE: 0,
    ADMIN: 0,
    LEADER: 0,
    MEMBER: 0,
    ADMIN_LEADER: 0,
    ADMIN_MEMBER: 0,
    LEADER_MEMBER: 0,
    ALL_ROLES: 0,
  },
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

/** Lê o catálogo inteiro (poucas dezenas de flags): o painel agrupa e pagina no cliente. */
async function fetchAllFlags(
  query: Omit<FeatureFlagQuery, 'page' | 'limit'>,
  signal: AbortSignal,
): Promise<FeatureFlagResponse[]> {
  const all: FeatureFlagResponse[] = [];
  for (let page = 1; page <= FEATURE_FLAGS_FETCH_MAX_PAGES; page += 1) {
    const listing = await apiListFeatureFlags(
      { ...query, page, limit: FEATURE_FLAGS_FETCH_LIMIT },
      { signal },
    );
    all.push(...(Array.isArray(listing.data) ? listing.data : []));
    if (page >= listing.meta.totalPages) break;
  }
  return all;
}

export function useFeatureFlagsManagement() {
  const [allFlags, setAllFlags] = useState<FeatureFlagResponse[]>([]);
  const [area, setArea] = useState<FeatureFlagAreaId | ''>('');
  const [stats, setStats] = useState<FeatureFlagStats>(EMPTY_STATS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(FEATURE_FLAGS_DEFAULT_LIMIT);
  const [search, setSearch] = useState('');
  const [filters, setFilters] =
    useState<FeatureFlagListFilters>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const debouncedSearch = useDebouncedValue(
    search,
    FEATURE_FLAGS_SEARCH_DEBOUNCE_MS,
  );

  useEffect(() => setPage(1), [debouncedSearch, filters, pageSize, area]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [flags, summary] = await Promise.all([
          fetchAllFlags(
            {
              searchString: debouncedSearch.trim() || undefined,
              enabled:
                filters.status === '' ? undefined : filters.status === 'true',
              audience:
                (filters.audience || undefined) as
                  | FeatureFlagAudience
                  | undefined,
              sort: filters.sort,
              order: filters.order,
            },
            controller.signal,
          ),
          apiGetFeatureFlagStats({ signal: controller.signal }),
        ]);

        setAllFlags(flags);
        setStats(summary);
      } catch (loadError: unknown) {
        if (axios.isCancel(loadError)) return;
        setAllFlags([]);
        setError(extractErrorMessage(loadError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [debouncedSearch, filters, reloadToken]);

  const refresh = useCallback(() => setReloadToken((value) => value + 1), []);

  const areaCounts = useMemo(() => countFlagsByArea(allFlags), [allFlags]);
  // Mesma ordem do painel: por área e, dentro dela, a ordenação escolhida.
  const filtered = useMemo(
    () =>
      groupFlagsByArea(allFlags)
        .flatMap((group) => group.items)
        .filter((flag) => area === '' || featureFlagAreaOf(flag.key) === area),
    [allFlags, area],
  );
  const total = filtered.length;
  const items = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return {
    items,
    area,
    setArea,
    areaCounts,
    stats,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    filters,
    setFilters,
    loading,
    error,
    setError,
    refresh,
  };
}

export function useFeatureFlagMutations(refresh: () => void) {
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const run = useCallback(
    async (action: () => Promise<string>): Promise<boolean> => {
      setSaving(true);
      setActionError('');
      try {
        setActionMessage(await action());
        refresh();
        return true;
      } catch (mutationError: unknown) {
        setActionError(extractErrorMessage(mutationError));
        // Versão desatualizada: recarrega para o admin ver o estado atual.
        if (isFeatureFlagVersionConflict(mutationError)) refresh();
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const save = useCallback(
    (
      values: FeatureFlagFormValues,
      editingKey?: string,
      expectedVersion?: number,
    ) =>
      run(async () => {
        if (editingKey) {
          await apiUpdateFeatureFlag(
            editingKey,
            toUpdateFeatureFlagRequest(values, expectedVersion),
          );
          return 'Feature flag atualizada.';
        }
        await apiCreateFeatureFlag(toCreateFeatureFlagRequest(values));
        return 'Feature flag criada.';
      }),
    [run],
  );

  // Estado desejado + versão lida: dois admins no painel não se atropelam (409).
  const toggle = useCallback(
    (target: FeatureFlagResponse) =>
      run(async () => {
        const flag = await apiSetFeatureFlagEnabled(target.key, {
          enabled: !target.enabled,
          expectedVersion: target.version,
        });
        return `"${flag.name}" ${flag.enabled ? 'ligada' : 'desligada'}.`;
      }),
    [run],
  );

  const remove = useCallback(
    (key: string) =>
      run(async () => {
        await apiDeleteFeatureFlag(key);
        return 'Feature flag removida.';
      }),
    [run],
  );

  const syncCatalog = useCallback(
    () =>
      run(async () => {
        const result = await apiSyncFeatureFlagCatalog();
        return result.count === 0 && result.retired.length === 0
          ? 'O catálogo já estava em dia.'
          : `Catálogo conferido: ${result.count} criada(s) e ${result.retired.length} aposentada(s).`;
      }),
    [run],
  );

  return {
    saving,
    actionError,
    setActionError,
    actionMessage,
    setActionMessage,
    save,
    toggle,
    remove,
    syncCatalog,
  };
}
