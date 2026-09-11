import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import { extractErrorMessage } from '@/utils/errorHandler';

import {
  apiCreateFeatureFlag,
  apiDeleteFeatureFlag,
  apiGetFeatureFlagStats,
  apiListFeatureFlags,
  apiSyncFeatureFlagCatalog,
  apiToggleFeatureFlag,
  apiUpdateFeatureFlag,
} from '../api';
import {
  FEATURE_FLAGS_DEFAULT_LIMIT,
  FEATURE_FLAGS_SEARCH_DEBOUNCE_MS,
} from '../constants';
import type {
  FeatureFlagAudience,
  FeatureFlagFormValues,
  FeatureFlagListFilters,
  FeatureFlagResponse,
  FeatureFlagStats,
} from '../types';
import {
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

export function useFeatureFlagsManagement() {
  const [items, setItems] = useState<FeatureFlagResponse[]>([]);
  const [total, setTotal] = useState(0);
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

  useEffect(() => setPage(1), [debouncedSearch, filters, pageSize]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [listing, summary] = await Promise.all([
          apiListFeatureFlags(
            {
              page,
              limit: pageSize,
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
            { signal: controller.signal },
          ),
          apiGetFeatureFlagStats({ signal: controller.signal }),
        ]);

        setItems(Array.isArray(listing.data) ? listing.data : []);
        setTotal(listing.meta.totalItems);
        setStats(summary);
      } catch (loadError: unknown) {
        if (axios.isCancel(loadError)) return;
        setItems([]);
        setTotal(0);
        setError(extractErrorMessage(loadError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [page, pageSize, debouncedSearch, filters, reloadToken]);

  const refresh = useCallback(() => setReloadToken((value) => value + 1), []);

  return {
    items,
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
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const save = useCallback(
    (values: FeatureFlagFormValues, editingKey?: string) =>
      run(async () => {
        if (editingKey) {
          await apiUpdateFeatureFlag(
            editingKey,
            toUpdateFeatureFlagRequest(values),
          );
          return 'Feature flag atualizada.';
        }
        await apiCreateFeatureFlag(toCreateFeatureFlagRequest(values));
        return 'Feature flag criada.';
      }),
    [run],
  );

  const toggle = useCallback(
    (key: string) =>
      run(async () => {
        const flag = await apiToggleFeatureFlag(key);
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
