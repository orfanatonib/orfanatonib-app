import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import { apiGetAllProfiles } from '../api';
import type { CompleteProfileListItem, PaginationMeta, QueryProfilesDto } from '../types';
import { logger } from '@/utils/logger';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { BIRTHDAYS_FETCH_LIMIT, DEFAULT_PROFILE_FILTERS, MANAGER_TEXTS, SEARCH_DEBOUNCE_MS } from './constants';
import { groupBirthdays, hasActiveProfileFilters, parseSortValue } from './utils';

/** Estado da tela "Nossa Família": lista paginada, filtros com debounce e painel de aniversários. */
export function useProfilesManager() {
  const [profiles, setProfiles] = useState<CompleteProfileListItem[]>([]);
  const [allProfiles, setAllProfiles] = useState<CompleteProfileListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CompleteProfileListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBirthdays, setLoadingBirthdays] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<QueryProfilesDto>(DEFAULT_PROFILE_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: debouncedSearch || undefined, page: 1 }));
  }, [debouncedSearch]);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGetAllProfiles(filters);
      setProfiles(response.items);
      setMeta(response.meta);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, MANAGER_TEXTS.loadError));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadAllProfilesForBirthdays = useCallback(async () => {
    try {
      setLoadingBirthdays(true);
      const response = await apiGetAllProfiles({ limit: BIRTHDAYS_FETCH_LIMIT });
      setAllProfiles(response.items);
    } catch (err: unknown) {
      // Só alimenta o painel de aniversários: sem ele a tela segue funcionando.
      logger.warn(MANAGER_TEXTS.birthdaysWarn, { feature: 'profiles' }, err);
    } finally {
      setLoadingBirthdays(false);
    }
  }, []);

  useEffect(() => { void loadProfiles(); }, [loadProfiles]);
  useEffect(() => { void loadAllProfilesForBirthdays(); }, [loadAllProfilesForBirthdays]);

  const birthdays = useMemo(() => groupBirthdays(allProfiles), [allProfiles]);

  const changePage = (_: React.ChangeEvent<unknown>, page: number) => setFilters((prev) => ({ ...prev, page }));
  const changeRole = (role: string) => setFilters((prev) => ({ ...prev, role: role === 'all' ? undefined : role, page: 1 }));
  const changeSort = (e: SelectChangeEvent<string>) => setFilters((prev) => ({ ...prev, ...parseSortValue(e.target.value), page: 1 }));
  const changeLimit = (e: SelectChangeEvent<number>) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }));
  const changeAdvanced = (field: keyof QueryProfilesDto, value: string) =>
    setFilters((prev) => ({ ...prev, [field]: value || undefined, page: 1 }));

  const clearFilters = () => {
    setSearchInput('');
    setFilters(DEFAULT_PROFILE_FILTERS);
  };

  const refresh = () => {
    void loadProfiles();
    void loadAllProfilesForBirthdays();
  };

  return {
    profiles,
    meta,
    birthdays,
    loading,
    loadingBirthdays,
    error,
    dismissError: () => setError(null),
    filters,
    hasActiveFilters: hasActiveProfileFilters(filters),
    searchInput,
    setSearchInput,
    showFilters,
    toggleFilters: () => setShowFilters((v) => !v),
    selectedProfile,
    setSelectedProfile,
    changePage,
    changeRole,
    changeSort,
    changeLimit,
    changeAdvanced,
    clearFilters,
    refresh,
  };
}

export type ProfilesManagerState = ReturnType<typeof useProfilesManager>;
